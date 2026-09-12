import os
import yaml
from pathlib import Path
from typing import Any, Dict

def get_video_project_root() -> Path:
    """Returns the project root directory for ML_VIDEO."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "config.yaml").exists() and parent.name == "ML_VIDEO":
            return parent
    return Path("c:/Users/Akash/Desktop/FilmyAI/ML_VIDEO")

def load_video_config(config_path: str = None) -> Dict[str, Any]:
    """Loads configuration from config.yaml in ML_VIDEO."""
    if config_path is None:
        config_path = get_video_project_root() / "config.yaml"
    else:
        config_path = Path(config_path)
    
    if not config_path.exists():
        fallback = Path("c:/Users/Akash/Desktop/FilmyAI/ML_VIDEO/config.yaml")
        if fallback.exists():
            config_path = fallback
        else:
            raise FileNotFoundError(f"Configuration file not found at {config_path}")
            
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config
