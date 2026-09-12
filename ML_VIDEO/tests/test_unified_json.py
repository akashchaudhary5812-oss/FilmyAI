"""
Test suite for Unified Video Analysis Engine and JSON Output Schema.
"""
import sys
import json
from pathlib import Path
import numpy as np
import cv2
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.inference.video_analyzer import FilmyAIVideoEngine


def create_sample_video(tmp_path: Path) -> Path:
    vpath = tmp_path / "sample_test_film.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(vpath), fourcc, 24.0, (320, 240))
    for i in range(48):  # 2 seconds
        frame = np.full((240, 320, 3), (i * 5 % 255, 100, 150), dtype=np.uint8)
        writer.write(frame)
    writer.release()
    return vpath


def test_unified_engine_e2e(tmp_path):
    vpath = create_sample_video(tmp_path)
    engine = FilmyAIVideoEngine(device="cpu")
    
    out_json = tmp_path / "film_intelligence_report.json"
    kdir = tmp_path / "keyframes"
    
    report = engine.analyze_video(
        video_path=str(vpath),
        output_json_path=str(out_json),
        keyframe_dir=str(kdir)
    )
    
    # Assert JSON structure conforming to FILMY AI specs
    assert report["engine"] == "FILMY_AI_Video_Intelligence_Engine"
    assert "film_metadata" in report
    assert "executive_summary" in report
    assert "cinematography_profile" in report
    assert "detailed_shots" in report
    assert "audio_intelligence" in report
    assert len(report["detailed_shots"]) >= 1
    
    first_shot = report["detailed_shots"][0]
    assert "shot_scale" in first_shot
    assert "predicted_class" in first_shot["shot_scale"]
    assert "confidence" in first_shot["shot_scale"]
    assert "cinematography" in first_shot
    assert "multi_task_predictions" in first_shot
    assert out_json.exists()


def test_video_edge_cases(tmp_path):
    # 1-frame video
    vpath = tmp_path / "one_frame.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(vpath), fourcc, 24.0, (160, 120))
    writer.write(np.zeros((120, 160, 3), dtype=np.uint8))
    writer.release()
    
    engine = FilmyAIVideoEngine(device="cpu")
    report = engine.analyze_video(str(vpath))
    assert report["film_metadata"]["total_frames"] == 1
    assert len(report["detailed_shots"]) == 1
