import os
import yaml
from pathlib import Path
from typing import Any, Dict

def get_project_root() -> Path:
    """Returns the project root directory (c:/Users/Akash/Desktop/FilmyAI/ML)."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "config.yaml").exists() or parent.name == "ML":
            return parent
    return Path("c:/Users/Akash/Desktop/FilmyAI/ML")

def load_config(config_path: str = None) -> Dict[str, Any]:
    """Loads configuration from config.yaml."""
    if config_path is None:
        config_path = get_project_root() / "config.yaml"
    else:
        config_path = Path(config_path)
    
    if not config_path.exists():
        # Try finding it relative to workspace
        workspace_cfg = Path("c:/Users/Akash/Desktop/FilmyAI/ML/config.yaml")
        if workspace_cfg.exists():
            config_path = workspace_cfg
        else:
            raise FileNotFoundError(f"Configuration file not found at {config_path}")
            
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config
