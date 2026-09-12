"""
ResNet-18 baseline model for film shot-scale classification.
Used for ablation and comparative benchmarking against EfficientNet-B0 and CinematicShotCNN.
"""
import torch
import torch.nn as nn
import torchvision.models as models


class ResNetShotClassifier(nn.Module):
    """
    ResNet-18 transfer learning baseline.
    """
    DEFAULT_CLASSES = [
        "ambiguous",
        "closeUp",
        "detail",
        "extremeLongShot",
        "fullShot",
        "longShot",
        "mediumCloseUp",
        "mediumShot"
    ]

    def __init__(self, num_classes: int = 8, pretrained: bool = True, dropout: float = 0.3):
        super().__init__()
        self.num_classes = num_classes
        self.classes = self.DEFAULT_CLASSES[:num_classes]
        
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        self.resnet = models.resnet18(weights=weights)
        in_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(p=dropout / 2.0),
            nn.Linear(256, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.resnet(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)
