"""
Test suite for Audio Feature Extraction and 4-Class Speech Activity Classifier.
"""
import sys
from pathlib import Path
import torch
import numpy as np
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.audio_video.speech_classifier import FilmSpeechClassifier, AudioFeatureExtractor


def test_speech_classifier_forward():
    model = FilmSpeechClassifier(input_dim=40, num_classes=4)
    model.eval()
    x = torch.randn(4, 40)
    with torch.no_grad():
        out = model(x)
        assert out.shape == (4, 4), f"Expected (4, 4), got {out.shape}"
        probs = model.predict_proba(x)
        assert torch.allclose(torch.sum(probs, dim=-1), torch.ones(4), atol=1e-5)


def test_audio_feature_extractor():
    extractor = AudioFeatureExtractor(sample_rate=16000, n_mels=40)
    # Synthetic 1-second audio tone
    t = np.linspace(0, 1.0, 16000, endpoint=False)
    synthetic_audio = 0.5 * np.sin(2 * np.pi * 440 * t)
    
    feats = extractor.extract_features_from_audio(synthetic_audio, sr=16000)
    assert feats.shape == (40,), f"Expected (40,), got {feats.shape}"
    assert not np.isnan(feats).any(), "Features must not contain NaN"
