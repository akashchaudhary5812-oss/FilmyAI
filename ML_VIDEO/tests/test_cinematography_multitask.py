"""
Test suite for Multi-Task Cinematography Network and Lighting/Composition Aesthetics.
"""
import sys
from pathlib import Path
import torch
import numpy as np
from PIL import Image
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.models.multitask_cinematography import MultiTaskCinematographyCNN
from ML_VIDEO.src.vfx.lighting_composition import FilmAestheticsAnalyzer


def test_multitask_forward():
    model = MultiTaskCinematographyCNN(pretrained=False)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        outputs = model(x)
        assert isinstance(outputs, dict)
        for task in ["shot_size", "camera_angle", "camera_movement", "composition", "lighting"]:
            assert task in outputs
            assert outputs[task].shape[0] == 2

        preds = model.predict(x)
        for task in ["shot_size", "camera_angle", "camera_movement", "composition", "lighting"]:
            assert len(preds[task]["class_name"]) == 2
            assert len(preds[task]["confidence"]) == 2


def test_film_aesthetics_analyzer():
    analyzer = FilmAestheticsAnalyzer()
    # High-key bright image
    bright_arr = np.full((480, 640, 3), 220, dtype=np.uint8)
    res = analyzer.analyze_frame(bright_arr)
    
    assert "lighting" in res
    assert "composition" in res
    assert res["lighting"]["mean_luminance"] > 180
    assert "High-Key" in res["lighting"]["style"] or "Natural" in res["lighting"]["style"]
    assert res["composition"]["aspect_ratio"] > 1.0
