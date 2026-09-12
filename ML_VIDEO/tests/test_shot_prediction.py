"""
Test suite for Shot Scale Classifiers (CinematicShotCNN, ResNet-18, EfficientNet-B0).
"""
import sys
from pathlib import Path
import torch
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ML_VIDEO.src.models.shot_classifier import CinematicShotCNN
from ML_VIDEO.src.models.resnet_shot import ResNetShotClassifier
from ML_VIDEO.src.models.efficientnet_shot import EfficientNetShotClassifier


def test_cinematic_shot_cnn_forward():
    model = CinematicShotCNN(num_classes=8)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
        assert out.shape == (2, 8), f"Expected shape (2, 8), got {out.shape}"
        emb = model.extract_visual_embedding(x)
        assert emb.shape == (2, 256), f"Expected embedding (2, 256), got {emb.shape}"


def test_resnet_shot_forward():
    model = ResNetShotClassifier(num_classes=8, pretrained=False)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
        assert out.shape == (2, 8)
        probs = model.predict_proba(x)
        assert torch.allclose(torch.sum(probs, dim=-1), torch.ones(2), atol=1e-5)


def test_efficientnet_shot_forward():
    model = EfficientNetShotClassifier(num_classes=8, pretrained=False)
    model.eval()
    x = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
        assert out.shape == (2, 8)
        probs = model.predict_proba(x)
        assert torch.allclose(torch.sum(probs, dim=-1), torch.ones(2), atol=1e-5)
