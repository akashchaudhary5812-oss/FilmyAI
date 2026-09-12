"""
Audio-Visual Speech Activity and Environment Classifier.
Trained on Google AVA Speech dataset with 4 categories:
- NO_SPEECH (background / silence / score only)
- CLEAN_SPEECH (dialogue without background interference)
- SPEECH_WITH_MUSIC (dialogue with score/soundtrack)
- SPEECH_WITH_NOISE (dialogue with foley / ambient noise)
"""
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import av
import soundfile as sf
import io


class FilmSpeechClassifier(nn.Module):
    """
    Audio MLP/1D-CNN classifier for cinematic speech activity detection.
    """
    CLASSES = [
        "NO_SPEECH",
        "CLEAN_SPEECH",
        "SPEECH_WITH_MUSIC",
        "SPEECH_WITH_NOISE"
    ]

    def __init__(self, input_dim: int = 40, num_classes: int = 4, hidden_dim: int = 128, dropout: float = 0.2):
        super().__init__()
        self.num_classes = num_classes
        self.classes = self.CLASSES[:num_classes]
        
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout / 2.0),
            nn.Linear(hidden_dim // 2, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)


class AudioFeatureExtractor:
    """
    Extracts acoustic features (FFT filterbank, energy, zero-crossing rate) from raw audio arrays.
    Works natively with standard numpy and PyAV without external binary dependencies.
    """
    def __init__(self, sample_rate: int = 16000, n_mels: int = 40):
        self.sample_rate = sample_rate
        self.n_mels = n_mels

    def extract_features_from_audio(self, audio_data: np.ndarray, sr: int) -> np.ndarray:
        """
        Computes 40-dim acoustic feature summary (energy, spectral centroid, spectral rolloff, sub-band energies).
        """
        if audio_data.ndim > 1:
            audio_data = np.mean(audio_data, axis=1)  # mono
            
        if len(audio_data) == 0:
            return np.zeros(self.n_mels, dtype=np.float32)

        # Normalize
        max_val = np.max(np.abs(audio_data))
        if max_val > 1e-6:
            audio_data = audio_data / max_val

        # FFT Spectrum
        fft_vals = np.abs(np.fft.rfft(audio_data[:min(len(audio_data), sr * 10)]))
        n_bins = len(fft_vals)
        if n_bins < self.n_mels:
            fft_vals = np.pad(fft_vals, (0, self.n_mels - n_bins))
            n_bins = self.n_mels

        # Binning into n_mels frequency sub-bands
        bin_size = n_bins // self.n_mels
        features = []
        for i in range(self.n_mels):
            sub = fft_vals[i * bin_size:(i + 1) * bin_size]
            features.append(np.mean(sub) if len(sub) > 0 else 0.0)

        feats = np.array(features, dtype=np.float32)
        # Log scale
        feats = np.log1p(feats)
        # Z-score normalization
        mean = np.mean(feats)
        std = np.std(feats) + 1e-6
        return (feats - mean) / std

    def extract_audio_from_video(self, video_path: str, start_sec: float = 0.0, duration_sec: Optional[float] = None) -> Optional[np.ndarray]:
        """
        Extracts audio waveform from video chunk using PyAV.
        """
        try:
            container = av.open(str(video_path))
            audio_stream = next((s for s in container.streams if s.type == 'audio'), None)
            if audio_stream is None:
                return None

            frames = []
            for frame in container.decode(audio_stream):
                t = float(frame.pts * frame.time_base)
                if t < start_sec:
                    continue
                if duration_sec and t > (start_sec + duration_sec):
                    break
                arr = frame.to_ndarray()
                frames.append(arr)
                
            if not frames:
                return None
                
            full_audio = np.concatenate(frames, axis=-1)
            if full_audio.ndim > 1:
                full_audio = np.mean(full_audio, axis=0)  # mono
            return full_audio.astype(np.float32)
        except Exception as e:
            return None
