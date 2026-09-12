"""
Test suite for Scene and Shot Boundary Detection and Keyframe Extraction.
"""
import sys
from pathlib import Path
import numpy as np
import cv2
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.segmentation.scene_detector import FilmSceneDetector
from ML_VIDEO.src.segmentation.keyframe_extractor import FilmKeyframeExtractor


def create_dummy_synthetic_video(tmp_path: Path, duration_sec: int = 3, fps: int = 24) -> Path:
    """Creates a temporary 3-shot synthetic video to test cut detection."""
    vpath = tmp_path / "test_synthetic_clip.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(vpath), fourcc, fps, (320, 240))
    
    # 3 distinct solid color shots
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    frames_per_shot = (duration_sec * fps) // len(colors)
    
    for color in colors:
        frame = np.full((240, 320, 3), color, dtype=np.uint8)
        for _ in range(frames_per_shot):
            writer.write(frame)
    writer.release()
    return vpath


def test_scene_detector(tmp_path):
    vpath = create_dummy_synthetic_video(tmp_path)
    detector = FilmSceneDetector(threshold=20.0, min_scene_len_sec=0.5)
    shots = detector.detect_scenes(str(vpath))
    
    assert len(shots) >= 1, "Should detect at least 1 shot"
    for s in shots:
        assert "shot_id" in s
        assert "start_time_sec" in s
        assert "end_time_sec" in s
        assert s["duration_sec"] > 0
        assert s["end_time_sec"] >= s["start_time_sec"]


def test_keyframe_extractor(tmp_path):
    vpath = create_dummy_synthetic_video(tmp_path)
    detector = FilmSceneDetector()
    shots = detector.detect_scenes(str(vpath))
    
    extractor = FilmKeyframeExtractor()
    out_dir = tmp_path / "keyframes"
    enriched = extractor.extract_keyframes_for_shots(str(vpath), shots, output_dir=str(out_dir))
    
    assert len(enriched) == len(shots)
    for s in enriched:
        assert "keyframe" in s
        assert "image" in s["keyframe"]
        assert "file_path" in s["keyframe"]
        assert Path(s["keyframe"]["file_path"]).exists()
