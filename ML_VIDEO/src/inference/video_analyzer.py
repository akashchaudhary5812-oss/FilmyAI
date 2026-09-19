"""
Unified Film Video Analysis Engine for FILMY AI.
Orchestrates:
1. Video reading & metadata probing
2. Shot & Scene segmentation (PySceneDetect + OpenCV)
3. Keyframe extraction
4. Deep Shot Scale Classification (EfficientNet-B0 / CinematicShotCNN)
5. Multi-task Cinematography analysis (angles, movement, composition, lighting)
6. Audio feature extraction & 4-class Speech Activity Classification (AVA Speech)
7. Production JSON generation
"""
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

from ML_VIDEO.src.models.shot_classifier import CinematicShotCNN
from ML_VIDEO.src.models.efficientnet_shot import EfficientNetShotClassifier
from ML_VIDEO.src.models.multitask_cinematography import MultiTaskCinematographyCNN
from ML_VIDEO.src.segmentation.scene_detector import FilmSceneDetector
from ML_VIDEO.src.segmentation.keyframe_extractor import FilmKeyframeExtractor
from ML_VIDEO.src.vfx.lighting_composition import FilmAestheticsAnalyzer
from ML_VIDEO.src.audio_video.speech_classifier import FilmSpeechClassifier, AudioFeatureExtractor
from ML_VIDEO.src.semantic.actor_identifier import SinglePassActorIdentifier
from ML_VIDEO.src.aggregation.json_exporter import generate_film_intelligence_report


class FilmyAIVideoEngine:
    """
    Production-grade Unified Film Video Intelligence Engine.
    """
    def __init__(
        self,
        shot_model_path: Optional[str] = None,
        multitask_model_path: Optional[str] = None,
        speech_model_path: Optional[str] = None,
        device: Optional[str] = None
    ):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[FilmyAIVideoEngine] Initializing on {self.device.upper()}...")

        # 1. Shot Scale Classifier (EfficientNet-B0 or CinematicShotCNN)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        self.shot_classes = [
            "ambiguous", "closeUp", "detail", "extremeLongShot",
            "fullShot", "longShot", "mediumCloseUp", "mediumShot"
        ]
        
        # Load best shot classifier checkpoint if available
        self.shot_model = EfficientNetShotClassifier(num_classes=8, pretrained=False)
        eff_ckpt = Path("ML_VIDEO/models/checkpoints/efficientnetb0_best.pt")
        cnn_ckpt = Path("ML_VIDEO/models/checkpoints/cinematic_shot_cnn_best.pt")
        
        if shot_model_path and Path(shot_model_path).exists():
            ckpt = torch.load(shot_model_path, map_location=self.device)
            self.shot_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
            print(f"[FilmyAIVideoEngine] Loaded shot model from: {shot_model_path}")
        elif eff_ckpt.exists():
            ckpt = torch.load(eff_ckpt, map_location=self.device)
            self.shot_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
            print(f"[FilmyAIVideoEngine] Loaded champion EfficientNet model from: {eff_ckpt}")
        elif cnn_ckpt.exists():
            self.shot_model = CinematicShotCNN(num_classes=8)
            ckpt = torch.load(cnn_ckpt, map_location=self.device)
            self.shot_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
            print(f"[FilmyAIVideoEngine] Loaded CinematicShotCNN model from: {cnn_ckpt}")
        
        self.shot_model = self.shot_model.to(self.device).eval()

        # 2. Multi-Task Cinematography Model
        self.multitask_model = MultiTaskCinematographyCNN(pretrained=False)
        if multitask_model_path and Path(multitask_model_path).exists():
            ckpt = torch.load(multitask_model_path, map_location=self.device)
            self.multitask_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
            print(f"[FilmyAIVideoEngine] Loaded multi-task model from: {multitask_model_path}")
        self.multitask_model = self.multitask_model.to(self.device).eval()

        # 3. Speech Classifier
        self.speech_model = FilmSpeechClassifier(input_dim=40, num_classes=4)
        sp_ckpt = Path("ML_VIDEO/models/checkpoints/speech_classifier_best.pt")
        if speech_model_path and Path(speech_model_path).exists():
            ckpt = torch.load(speech_model_path, map_location=self.device)
            self.speech_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
        elif sp_ckpt.exists():
            ckpt = torch.load(sp_ckpt, map_location=self.device)
            self.speech_model.load_state_dict(ckpt.get("model_state_dict", ckpt))
        self.speech_model = self.speech_model.to(self.device).eval()

        # 4. Pipeline Modules
        self.scene_detector = FilmSceneDetector()
        self.keyframe_extractor = FilmKeyframeExtractor()
        self.aesthetics_analyzer = FilmAestheticsAnalyzer()
        self.audio_extractor = AudioFeatureExtractor()
        self.actor_identifier = SinglePassActorIdentifier(device=self.device)

    def analyze_video(
        self,
        video_path: str,
        cast_members: Optional[List[Dict[str, Any]]] = None,
        output_json_path: Optional[str] = None,
        keyframe_dir: Optional[str] = None,
        max_duration_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes complete multimodal analysis of a video file with single-pass actor identification.
        """
        vpath = Path(video_path)
        if not vpath.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        start_time = time.time()
        print(f"\n[FilmyAIVideoEngine] Analyzing video: {vpath.name}")

        # Step 0: Register Cast Members & Compute Reference Face Embeddings
        if cast_members:
            self.actor_identifier.register_cast_members(cast_members)

        # Step 1: Video Metadata Probe
        cap = cv2.VideoCapture(str(vpath))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps
        cap.release()

        if max_duration_sec and duration > max_duration_sec:
            duration = max_duration_sec

        metadata = {
            "source_file": vpath.name,
            "duration_seconds": round(duration, 2),
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "resolution": f"{width}x{height}",
            "aspect_ratio": f"{round(width/max(1, height), 2)}:1"
        }

        # Step 2: Scene & Shot Segmentation
        print("[FilmyAIVideoEngine] Detecting shots and scene transitions...")
        shots = self.scene_detector.detect_scenes(str(vpath), max_duration_sec=max_duration_sec)
        print(f"[FilmyAIVideoEngine] Detected {len(shots)} distinct shots.")

        # Step 3: Keyframe Extraction
        print("[FilmyAIVideoEngine] Extracting cinematic keyframes...")
        enriched_shots = self.keyframe_extractor.extract_keyframes_for_shots(
            str(vpath), shots, output_dir=keyframe_dir
        )

        # Step 4: Visual & Cinematography Inference + Single-Pass Actor Identification per Shot
        print("[FilmyAIVideoEngine] Running deep vision classifiers & actor identification...")
        analyzed_shots = []
        for shot in enriched_shots:
            kinfo = shot.get("keyframe")
            if not kinfo or "image" not in kinfo:
                continue
            
            img_pil = kinfo["image"]
            tensor_img = self.transform(img_pil).unsqueeze(0).to(self.device)

            # 4a. Shot Scale Classification
            with torch.no_grad():
                shot_logits = self.shot_model(tensor_img)
                shot_probs = torch.softmax(shot_logits, dim=-1).squeeze(0).cpu().numpy()
                pred_idx = int(np.argmax(shot_probs))
                pred_class = self.shot_classes[pred_idx] if pred_idx < len(self.shot_classes) else "unknown"
                conf = float(shot_probs[pred_idx])

            # 4b. Multi-task Cinematography
            mt_results = self.multitask_model.predict(tensor_img)
            cinematography_preds = {
                task: {
                    "prediction": data["class_name"][0],
                    "confidence": round(data["confidence"][0], 3)
                }
                for task, data in mt_results.items()
            }

            # 4c. Lighting & Composition Aesthetics
            aesthetics = self.aesthetics_analyzer.analyze_frame(img_pil)

            # 4d. Single-Pass Actor Matching for this Shot
            detected_actors = self.actor_identifier.process_shot_keyframe(
                shot_id=shot["shot_id"],
                start_time_sec=shot["start_time_sec"],
                end_time_sec=shot["end_time_sec"],
                duration_sec=shot["duration_sec"],
                keyframe_image=img_pil,
                shot_scale=pred_class,
                lighting=aesthetics.get("lighting", {}).get("style", "unknown"),
                composition=aesthetics.get("composition", {}).get("detected_rule", "unknown")
            )

            # Assemble shot record (omit raw PIL image from JSON)
            shot_record = {
                "shot_id": shot["shot_id"],
                "start_time_sec": shot["start_time_sec"],
                "end_time_sec": shot["end_time_sec"],
                "duration_sec": shot["duration_sec"],
                "keyframe_file": kinfo.get("file_path", f"frame_{kinfo['frame_index']:06d}"),
                "shot_scale": {
                    "predicted_class": pred_class,
                    "confidence": round(conf, 4),
                    "probabilities": {cls_name: round(float(shot_probs[i]), 4) for i, cls_name in enumerate(self.shot_classes)}
                },
                "cinematography": aesthetics,
                "multi_task_predictions": cinematography_preds,
                "detected_actors": detected_actors
            }
            analyzed_shots.append(shot_record)

        # Step 5: Audio Speech Activity Classification
        print("[FilmyAIVideoEngine] Extracting and analyzing audio track...")
        audio_data = self.audio_extractor.extract_audio_from_video(str(vpath), duration_sec=max_duration_sec)
        if audio_data is not None and len(audio_data) > 0:
            audio_feats = self.audio_extractor.extract_features_from_audio(audio_data, sr=16000)
            feat_tensor = torch.tensor(audio_feats).unsqueeze(0).to(self.device)
            with torch.no_grad():
                sp_logits = self.speech_model(feat_tensor)
                sp_probs = torch.softmax(sp_logits, dim=-1).squeeze(0).cpu().numpy()
                sp_idx = int(np.argmax(sp_probs))
                dom_speech = self.speech_model.classes[sp_idx]
                sp_conf = float(sp_probs[sp_idx])
            
            audio_summary = {
                "has_audio_track": True,
                "dominant_acoustic_mode": dom_speech,
                "confidence": round(sp_conf, 4),
                "probabilities": {c: round(float(sp_probs[i]), 4) for i, c in enumerate(self.speech_model.classes)}
            }
        else:
            audio_summary = {
                "has_audio_track": False,
                "dominant_acoustic_mode": "NO_AUDIO_STREAM_FOUND",
                "confidence": 1.0,
                "probabilities": {}
            }

        # Step 6: Pacing & Rhythm Metrics
        avg_shot_len = duration / max(1, len(analyzed_shots))
        if avg_shot_len < 2.5:
            rhythm = "Fast / Kinetic Action Pacing"
        elif avg_shot_len < 5.0:
            rhythm = "Moderate Cinematic Narrative Pacing"
        elif avg_shot_len < 9.0:
            rhythm = "Slow Dramatic / Atmospheric Pacing"
        else:
            rhythm = "Contemplative / Extended Long-Take Pacing"

        pacing_metrics = {
            "average_shot_length_sec": round(avg_shot_len, 2),
            "rhythm_classification": rhythm,
            "cuts_per_minute": round((len(analyzed_shots) / max(0.1, duration)) * 60.0, 2)
        }

        # Step 7: Scene Grouping
        scenes = [{
            "scene_id": 1,
            "start_time_sec": 0.0,
            "end_time_sec": round(duration, 2),
            "shot_count": len(analyzed_shots),
            "pacing": rhythm
        }]

        # Step 8: Aggregate Cast Intelligence from Video Evidence
        cast_performance = self.actor_identifier.aggregate_cast_intelligence(
            total_film_duration=duration,
            total_shots=len(analyzed_shots),
            audio_speech_mode=audio_summary.get("dominant_acoustic_mode", "Speech")
        )

        # Step 9: Build Production Report
        report = generate_film_intelligence_report(
            video_path=str(vpath),
            metadata=metadata,
            shots_analysis=analyzed_shots,
            scene_segments=scenes,
            audio_summary=audio_summary,
            pacing_metrics=pacing_metrics,
            cast_performance=cast_performance,
            output_path=output_json_path
        )

        elapsed = round(time.time() - start_time, 2)
        print(f"[FilmyAIVideoEngine] Complete analysis finished in {elapsed}s!")
        return report

