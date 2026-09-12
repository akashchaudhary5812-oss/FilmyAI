import random
import numpy as np
import joblib
from pathlib import Path
from typing import Any

def set_seed(seed: int = 42) -> None:
    """Sets random seeds across random and numpy."""
    random.seed(seed)
    np.random.seed(seed)

def save_artifact(obj: Any, file_path: str) -> None:
    """Saves a python object using joblib with directory creation."""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(obj, path)

def load_artifact(file_path: str) -> Any:
    """Loads a serialized python object from file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Artifact not found at {path}")
    return joblib.load(path)
