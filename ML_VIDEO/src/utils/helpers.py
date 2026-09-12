import random
import numpy as np
import torch
from pathlib import Path
from typing import Any

def set_video_seed(seed: int = 42) -> None:
    """Sets random seeds across random, numpy, and torch."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def get_device() -> torch.device:
    """Returns best available PyTorch device (CUDA or CPU)."""
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")
