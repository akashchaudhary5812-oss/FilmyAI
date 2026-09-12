"""
EfficientNet-B0 transfer learning model for film shot-scale classification.
"""
import torch
import torch.nn as nn
import torchvision.models as models
try:
    import timm
    HAS_TIMM = True
except ImportError:
    HAS_TIMM = False


class EfficientNetShotClassifier(nn.Module):
    """
    Shot scale classifier leveraging pretrained EfficientNet-B0.
    Outputs probability distribution over 8 cinematic shot classes.
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
        
        if HAS_TIMM:
            self.backbone = timm.create_model(
                'efficientnet_b0',
                pretrained=pretrained,
                num_classes=0,  # pooled feature extractor
                drop_rate=dropout
            )
            in_features = self.backbone.num_features
        else:
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            effnet = models.efficientnet_b0(weights=weights)
            in_features = effnet.classifier[1].in_features
            effnet.classifier = nn.Identity()
            self.backbone = effnet

        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, 256),
            nn.SiLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(p=dropout / 2.0),
            nn.Linear(256, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feat = self.backbone(x)
        if feat.dim() > 2:
            feat = torch.flatten(feat, 1)
        logits = self.classifier(feat)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)
