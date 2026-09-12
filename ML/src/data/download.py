import os
import shutil
from pathlib import Path
import kagglehub
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import load_config, get_project_root

logger = setup_logger("FilmyAI-Download")

def download_all_datasets() -> dict:
    """Downloads all 3 datasets using kagglehub and stages them under ML/data/raw/."""
    config = load_config()
    root = get_project_root()
    raw_dir = root / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    dataset_handles = config.get("datasets", {
        "imdb_ott": "yashmotiani/imdb-ott-platforms-movies-power-bi-dashboard",
        "bollywood_actress": "bhanupratapbiswas/bollywood-actress-name-and-movie-list",
        "bollywood_movies": "mitesh58/bollywood-movie-dataset"
    })
    
    downloaded_paths = {}
    
    for key, handle in dataset_handles.items():
        logger.info(f"Downloading dataset: '{handle}' for '{key}'...")
        try:
            download_dir = kagglehub.dataset_download(handle)
            logger.info(f"KaggleHub cache path for {key}: {download_dir}")
            
            target_subfolder = raw_dir / key
            target_subfolder.mkdir(parents=True, exist_ok=True)
            
            # Copy all files from download_dir into target_subfolder
            for item in Path(download_dir).iterdir():
                dest = target_subfolder / item.name
                if item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)
                    
            downloaded_paths[key] = str(target_subfolder)
            logger.info(f"Successfully staged {key} at {target_subfolder}")
        except Exception as e:
            logger.error(f"Failed to download dataset {handle}: {e}")
            raise e
            
    return downloaded_paths

if __name__ == "__main__":
    download_all_datasets()
