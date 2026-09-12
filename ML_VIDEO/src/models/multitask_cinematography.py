"""
Multi-Task Cinematography Network.
Predicts 5 film aesthetics dimensions simultaneously from a single cinematic keyframe:
1. Shot Size
2. Camera Angle
3. Camera Movement / Motion
4. Composition Style
5. Lighting Setup
"""
from typing import Dict, List, Optional
import torch
import torch.nn as nn
import torchvision.models as models
try:
    import timm
    HAS_TIMM = True
except ImportError:
    HAS_TIMM = False


class MultiTaskCinematographyCNN(nn.Module):
    """
    Multi-Task Deep Learning model with shared visual backbone and specialized task heads.
    """
    DEFAULT_HEAD_CONFIG = {
        "shot_size": [
            "Extreme Long Shot", "Long Shot", "Medium Shot",
            "Medium Close-Up", "Close-Up", "Extreme Close-Up"
        ],
        "camera_angle": [
            "Eye-Level", "Low Angle", "High Angle", "Aerial / Bird's Eye", "Dutch / Canted"
        ],
        "camera_movement": [
            "Static", "Pan", "Tilt", "Tracking / Dolly", "Zoom", "Crane / Boom"
        ],
        "composition": [
            "Rule of Thirds", "Center Framed", "Symmetrical", "Leading Lines / Depth"
        ],
        "lighting": [
            "High Key", "Low Key / Chiaroscuro", "Natural / Ambient", "Backlit / Silhouette"
        ]
    }

    def __init__(
        self,
        backbone_name: str = "efficientnet_b0",
        pretrained: bool = True,
        head_classes: Optional[Dict[str, List[str]]] = None,
        dropout: float = 0.3
    ):
        super().__init__()
        self.head_classes = head_classes or self.DEFAULT_HEAD_CONFIG
        
        # Shared visual feature extractor
        if HAS_TIMM:
            self.backbone = timm.create_model(
                backbone_name,
                pretrained=pretrained,
                num_classes=0,
                drop_rate=dropout
            )
            in_features = self.backbone.num_features
        else:
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            effnet = models.efficientnet_b0(weights=weights)
            in_features = effnet.classifier[1].in_features
            effnet.classifier = nn.Identity()
            self.backbone = effnet

        # Shared representation projection
        self.shared_dense = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, 512),
            nn.SiLU(),
            nn.BatchNorm1d(512)
        )

        # Specialized heads for each cinematography dimension
        self.heads = nn.ModuleDict()
        for task_name, classes in self.head_classes.items():
            num_classes = len(classes)
            self.heads[task_name] = nn.Sequential(
                nn.Dropout(p=dropout / 2.0),
                nn.Linear(512, 128),
                nn.SiLU(),
                nn.BatchNorm1d(128),
                nn.Linear(128, num_classes)
            )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        features = self.backbone(x)
        if features.dim() > 2:
            features = torch.flatten(features, 1)
        shared = self.shared_dense(features)
        
        outputs = {}
        for task_name, head in self.heads.items():
            outputs[task_name] = head(shared)
        return outputs

    def predict(self, x: torch.Tensor) -> Dict[str, Dict[str, any]]:
        self.eval()
        with torch.no_grad():
            outputs = self.forward(x)
            results = {}
            for task_name, logits in outputs.items():
                probs = torch.softmax(logits, dim=-1)
                best_idx = torch.argmax(probs, dim=-1)
                classes = self.head_classes[task_name]
                
                results[task_name] = {
                    "class_name": [classes[i.item()] if i.item() < len(classes) else "unknown" for i in best_idx],
                    "confidence": [probs[idx, i.item()].item() for idx, i in enumerate(best_idx)],
                    "probabilities": {
                        classes[c]: [probs[idx, c].item() for idx in range(len(probs))]
                        for c in range(len(classes))
                    }
                }
            return results
