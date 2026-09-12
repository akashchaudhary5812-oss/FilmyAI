import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any

class ConvBlock(nn.Module):
    """Convolutional building block with BatchNorm and LeakyReLU."""
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.LeakyReLU(0.1, inplace=True)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.relu(self.bn(self.conv(x)))

class CinematicShotCNN(nn.Module):
    """
    FilmyAI Deep Vision Network for Cinematographic Shot Scale Classification.
    Accepts 224x224 RGB video frames and outputs probability distributions over 8 film shot categories.
    """
    def __init__(self, num_classes: int = 8, in_channels: int = 3):
        super().__init__()
        
        # Feature Extraction Backbone
        self.layer1 = nn.Sequential(
            ConvBlock(in_channels, 32, stride=2), # 112x112
            ConvBlock(32, 32, stride=1),
            nn.MaxPool2d(2, 2)                    # 56x56
        )
        
        self.layer2 = nn.Sequential(
            ConvBlock(32, 64, stride=2),          # 28x28
            ConvBlock(64, 64, stride=1),
            nn.MaxPool2d(2, 2)                    # 14x14
        )
        
        self.layer3 = nn.Sequential(
            ConvBlock(64, 128, stride=2),         # 7x7
            ConvBlock(128, 128, stride=1)
        )
        
        self.layer4 = nn.Sequential(
            ConvBlock(128, 256, stride=1),
            ConvBlock(256, 256, stride=1)
        )
        
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        
        # Classification Head
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(128, num_classes)
        )
        
        # Initialize weights
        self._init_weights()
        
    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='leaky_relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)
                
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.global_pool(x)
        x = torch.flatten(x, 1)
        logits = self.classifier(x)
        return logits

    def extract_visual_embedding(self, x: torch.Tensor) -> torch.Tensor:
        """Extracts 256-dimensional cinematographic feature vector for multimodal fusion."""
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.global_pool(x)
        return torch.flatten(x, 1)
