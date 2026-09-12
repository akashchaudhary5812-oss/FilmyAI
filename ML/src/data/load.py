import os
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root

logger = setup_logger("FilmyAI-Loader")

def load_raw_csv_files() -> Dict[str, pd.DataFrame]:
    """Loads all CSV files from ML/data/raw/ into a dictionary of DataFrames."""
    root = get_project_root()
    raw_dir = root / "data" / "raw"
    
    dfs = {}
    csv_paths = list(raw_dir.rglob("*.csv"))
    logger.info(f"Found {len(csv_paths)} CSV files in {raw_dir}")
    
    for p in sorted(csv_paths):
        rel_path = p.relative_to(raw_dir).as_posix()
        try:
            # Try utf-8 first, fallback to latin-1
            try:
                df = pd.read_csv(p, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(p, encoding="latin-1")
            dfs[rel_path] = df
            logger.info(f"Loaded '{rel_path}': shape {df.shape}")
        except Exception as e:
            logger.error(f"Error loading '{rel_path}': {e}")
            
    return dfs

if __name__ == "__main__":
    dfs = load_raw_csv_files()
    for name, df in dfs.items():
        print(f"\n--- {name} ---")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
