import json
import torch
from pathlib import Path
from PIL import Image
from typing import Tuple, List, Dict
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

from ML_VIDEO.src.utils.config import get_video_project_root
from ML_VIDEO.src.utils.logging import setup_logger

logger = setup_logger("FilmyAI-VideoDataset")

class FilmShotDataset(Dataset):
    """PyTorch Dataset for real film shot images and cinematographic labels."""
    
    def __init__(self, records: List[Dict[str, Any]], transform=None):
        self.records = records
        self.transform = transform
        
    def __len__(self) -> int:
        return len(self.records)
        
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        item = self.records[idx]
        img_path = item["local_path"]
        img = Image.open(img_path).convert("RGB")
        
        if self.transform:
            img = self.transform(img)
            
        label = item["shot_scale_code"]
        label_name = item["shot_scale_label"]
        return img, label, label_name

def get_shot_data_loaders(
    batch_size: int = 32,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    random_seed: int = 42
) -> Tuple[DataLoader, DataLoader, DataLoader, List[str]]:
    """Creates train, validation, and test PyTorch DataLoaders from real staged film shots."""
    root = get_video_project_root()
    meta_path = root / "data" / "raw" / "types_of_film_shots" / "shot_metadata.json"
    
    if not meta_path.exists():
        raise FileNotFoundError(f"Metadata file not found at {meta_path}. Run download_datasets first.")
        
    with open(meta_path, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    # Class names in sorted code order
    class_map = {}
    for r in records:
        class_map[r["shot_scale_code"]] = r["shot_scale_label"]
    class_names = [class_map[i] for i in sorted(class_map.keys())]
    
    # Deterministic split
    import random
    random.seed(random_seed)
    shuffled = records.copy()
    random.shuffle(shuffled)
    
    n_total = len(shuffled)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)
    
    train_records = shuffled[:n_train]
    val_records = shuffled[n_train:n_train + n_val]
    test_records = shuffled[n_train + n_val:]
    
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_ds = FilmShotDataset(train_records, transform=train_transform)
    val_ds = FilmShotDataset(val_records, transform=val_transform)
    test_ds = FilmShotDataset(test_records, transform=val_transform)
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
    
    logger.info(f"DataLoaders created: Train={len(train_ds)} samples ({len(train_loader)} batches), Val={len(val_ds)} samples ({len(val_loader)} batches), Test={len(test_ds)} samples ({len(test_loader)} batches)")
    return train_loader, val_loader, test_loader, class_names
