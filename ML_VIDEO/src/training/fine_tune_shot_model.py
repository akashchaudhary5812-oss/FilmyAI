"""
Fine-Tuning Engine for ML_VIDEO Cinematic Shot Classifier.
Integrates:
1. Champion checkpoint: ML_VIDEO/models/checkpoints/best_cinematic_shot_model.pt
2. Types of Film Shots dataset (863 images)
3. ShotBench multi-task cinematography dataset (3,043 keyframes)

Evaluates Candidate v2 vs Baseline on disjoint holdout test set.
"""
import os
import json
import random
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

from ML_VIDEO.src.models.shot_classifier import CinematicShotCNN

SHOT_CLASSES = [
    "ambiguous", "closeUp", "detail", "extremeLongShot",
    "fullShot", "longShot", "mediumCloseUp", "mediumShot"
]
CLASS_TO_IDX = {c: i for i, c in enumerate(SHOT_CLASSES)}

SHOTBENCH_MAP = {
    "Extreme Close Up": "detail",
    "Close Up": "closeUp",
    "Medium Close Up": "mediumCloseUp",
    "Medium": "mediumShot",
    "Medium Wide": "fullShot",
    "Wide": "longShot",
    "Extreme Wide": "extremeLongShot",
    "Close Up, Extreme Close Up": "closeUp",
    "Medium, Medium Close Up": "mediumCloseUp",
    "Medium, Medium Wide": "mediumShot",
    "Medium Wide, Wide": "fullShot",
    "Extreme Wide, Wide": "extremeLongShot",
    "Close Up, Medium Close Up": "mediumCloseUp"
}


class UnifiedCinematographyDataset(Dataset):
    def __init__(self, samples: List[Tuple[str, int]], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label_idx = self.samples[idx]
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), (128, 128, 128))
            
        if self.transform:
            img = self.transform(img)
        return img, label_idx


def build_unified_dataset_samples(workspace_root: Path) -> List[Tuple[str, int]]:
    samples = []
    
    # 1. Load Types of Film Shots
    tfs_meta_path = workspace_root / "ML_VIDEO" / "data" / "raw" / "types_of_film_shots" / "shot_metadata.json"
    tfs_img_dir = workspace_root / "ML_VIDEO" / "data" / "raw" / "types_of_film_shots" / "images"
    
    if tfs_meta_path.exists():
        with open(tfs_meta_path, "r") as f:
            tfs_data = json.load(f)
        for item in tfs_data:
            fname = item.get("file_name") or item.get("filename")
            lbl = item.get("shot_type") or item.get("label")
            if fname and lbl in CLASS_TO_IDX:
                p = tfs_img_dir / fname
                if p.exists():
                    samples.append((str(p), CLASS_TO_IDX[lbl]))
                    
    # 2. Load ShotBench Shot Size Annotations
    sb_tsv = workspace_root / "ML_VIDEO" / "datasets" / "shotbench" / "test.tsv"
    sb_img_base = workspace_root / "ML_VIDEO" / "datasets" / "shotbench" / "images"
    
    if sb_tsv.exists():
        df_sb = pd.read_csv(sb_tsv, sep="\t")
        shot_size_df = df_sb[df_sb["category"] == "shot size"]
        for _, r in shot_size_df.iterrows():
            opts = json.loads(r["options"]) if isinstance(r["options"], str) else r["options"]
            ans = r["answer"]
            raw_label = opts.get(ans, "")
            mapped_cls = SHOTBENCH_MAP.get(raw_label)
            if mapped_cls and mapped_cls in CLASS_TO_IDX:
                paths_raw = r["path"]
                if isinstance(paths_raw, str):
                    clean_p = paths_raw.strip("[]'\" ")
                else:
                    clean_p = str(paths_raw[0])
                full_path = sb_img_base / clean_p
                if full_path.exists():
                    samples.append((str(full_path), CLASS_TO_IDX[mapped_cls]))
                    
    print(f"[Dataset] Gathered {len(samples)} unified cinematography keyframe samples.")
    return samples


def fine_tune_and_evaluate(workspace_root: Path = None, epochs: int = 6):
    if workspace_root is None:
        workspace_root = Path(__file__).resolve().parent.parent.parent.parent
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Fine-Tuning] Running on device: {device.upper()}")
    
    samples = build_unified_dataset_samples(workspace_root)
    random.seed(42)
    random.shuffle(samples)
    
    n_total = len(samples)
    n_train = int(0.75 * n_total)
    n_val = int(0.12 * n_total)
    
    train_samples = samples[:n_train]
    val_samples = samples[n_train:n_train + n_val]
    test_samples = samples[n_train + n_val:]
    
    print(f"[Splits] Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)}")
    
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_ds = UnifiedCinematographyDataset(train_samples, transform=train_transform)
    val_ds = UnifiedCinematographyDataset(val_samples, transform=eval_transform)
    test_ds = UnifiedCinematographyDataset(test_samples, transform=eval_transform)
    
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False)
    
    # Initialize model from champion checkpoint
    model = CinematicShotCNN(num_classes=8)
    champion_path = workspace_root / "ML_VIDEO" / "models" / "checkpoints" / "best_cinematic_shot_model.pt"
    
    if champion_path.exists():
        ckpt = torch.load(champion_path, map_location=device)
        model.load_state_dict(ckpt.get("model_state_dict", ckpt))
        print(f"[Fine-Tuning] Initialized from champion checkpoint: {champion_path.name}")
    else:
        print("[Fine-Tuning] Training fresh candidate architecture...")
        
    model = model.to(device)
    
    # Evaluate baseline first on this test set
    model.eval()
    all_preds_base = []
    all_targets = []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            imgs = imgs.to(device)
            logits = model(imgs)
            preds = torch.argmax(logits, dim=1).cpu().numpy()
            all_preds_base.extend(preds)
            all_targets.extend(lbls.numpy())
            
    base_acc = float(np.mean(np.array(all_preds_base) == np.array(all_targets)))
    print(f"[Baseline Evaluation] Test Accuracy: {base_acc:.4f}")
    
    # Fine-tuning loop
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_acc = 0.0
    best_candidate_state = None
    
    print("\n--- Starting Fine-Tuning Epochs ---")
    for ep in range(epochs):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        
        for imgs, lbls in train_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, lbls)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item() * imgs.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == lbls).sum().item()
            total += imgs.size(0)
            
        scheduler.step()
        train_acc = correct / max(1, total)
        train_loss = total_loss / max(1, total)
        
        # Val evaluation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                logits = model(imgs)
                preds = torch.argmax(logits, dim=1)
                val_correct += (preds == lbls).sum().item()
                val_total += imgs.size(0)
                
        val_acc = val_correct / max(1, val_total)
        print(f"Epoch [{ep+1}/{epochs}] -> Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f}")
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_candidate_state = model.state_dict().copy()
            
    # Load best candidate state and evaluate on test set
    if best_candidate_state:
        model.load_state_dict(best_candidate_state)
        
    model.eval()
    all_preds_cand = []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            imgs = imgs.to(device)
            logits = model(imgs)
            preds = torch.argmax(logits, dim=1).cpu().numpy()
            all_preds_cand.extend(preds)
            
    cand_acc = float(np.mean(np.array(all_preds_cand) == np.array(all_targets)))
    print(f"\n[Final Candidate Evaluation] Holdout Test Accuracy: {cand_acc:.4f} (vs Baseline: {base_acc:.4f})")
    
    # Save candidate checkpoint
    candidate_ckpt_path = workspace_root / "ML_VIDEO" / "models" / "checkpoints" / "candidate_cinematic_shot_model_v2.pt"
    champion_dest_path = workspace_root / "ML_VIDEO" / "models" / "checkpoints" / "best_cinematic_shot_model.pt"
    
    torch.save({"model_state_dict": model.state_dict(), "version": "2.0.0-filmyai-video"}, candidate_ckpt_path)
    print(f"[Model Checkpoint] Saved candidate checkpoint to: {candidate_ckpt_path.name}")
    
    # If candidate is equal or better, update champion checkpoint safely
    if cand_acc >= base_acc:
        torch.save({"model_state_dict": model.state_dict(), "version": "2.0.0-filmyai-video"}, champion_dest_path)
        print(f"[Model Promotion] Candidate outperformed baseline ({cand_acc:.4f} >= {base_acc:.4f}). Promoted to champion checkpoint.")
        
    # Update video model metadata
    metadata = {
        "version": "2.0.0-filmyai-video",
        "datasets_used": ["szymonrucinski/types-of-film-shots", "Vchitect/ShotBench"],
        "train_samples": len(train_samples),
        "val_samples": len(val_samples),
        "test_samples": len(test_samples),
        "epochs": epochs,
        "best_val_accuracy": best_val_acc,
        "test_metrics": {
            "baseline_accuracy": base_acc,
            "candidate_accuracy": cand_acc,
            "classes": SHOT_CLASSES
        },
        "checkpoint_path": str(champion_dest_path)
    }
    
    with open(workspace_root / "ML_VIDEO" / "models" / "video_model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print("[Complete] Video shot classifier upgrade finished successfully.")
    return metadata


if __name__ == "__main__":
    fine_tune_and_evaluate(epochs=5)
