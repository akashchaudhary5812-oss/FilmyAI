"""
Training and Evaluation Pipeline for Multi-Task Cinematography Network.
Trains shared EfficientNet-B0 backbone with 5 specialized heads:
1. Shot Size
2. Camera Angle
3. Camera Movement
4. Composition Style
5. Lighting Style
"""
import time
import json
import sys
import ast
import csv
from pathlib import Path
from typing import Dict, Any, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from ML_VIDEO.src.models.multitask_cinematography import MultiTaskCinematographyCNN


class ShotBenchMultiTaskDataset(Dataset):
    """Dataset for ShotBench multi-task cinematography images and labels."""
    def __init__(self, records: List[Dict[str, Any]], head_classes: Dict[str, List[str]], transform=None):
        self.records = records
        self.head_classes = head_classes
        self.transform = transform
        
        # Build class-to-index maps
        self.class_maps = {
            task: {c.lower(): idx for idx, c in enumerate(classes)}
            for task, classes in head_classes.items()
        }

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, Dict[str, int]]:
        item = self.records[idx]
        img_path = item["image_path"]
        try:
            img = Image.open(img_path).convert("RGB")
        except Exception:
            # Fallback black image if corrupt
            img = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform:
            img = self.transform(img)

        # Labels for each available task (-1 if not annotated)
        target_labels = {}
        for task, cmap in self.class_maps.items():
            val = item.get(task)
            if val is not None and str(val).lower() in cmap:
                target_labels[task] = cmap[str(val).lower()]
            else:
                # Approximate match or default to 0
                target_labels[task] = 0

        return img, target_labels


def prepare_shotbench_data(
    shotbench_dir: str = "ML_VIDEO/datasets/shotbench",
    batch_size: int = 32
) -> Tuple[DataLoader, DataLoader, DataLoader, Dict[str, List[str]]]:
    sdir = Path(shotbench_dir)
    tsv_path = sdir / "test.tsv"
    images_dir = sdir / "images"

    if not tsv_path.exists():
        raise FileNotFoundError(f"ShotBench TSV not found at {tsv_path}")

    head_classes = {
        "shot_size": ["Extreme Long Shot", "Long Shot", "Medium Shot", "Medium Close-Up", "Close-Up", "Extreme Close-Up"],
        "camera_angle": ["Eye-Level", "Low Angle", "High Angle", "Aerial / Bird's Eye", "Dutch / Canted"],
        "camera_movement": ["Static", "Pan", "Tilt", "Tracking / Dolly", "Zoom", "Crane / Boom"],
        "composition": ["Rule of Thirds", "Center Framed", "Symmetrical", "Leading Lines / Depth"],
        "lighting": ["High Key", "Low Key / Chiaroscuro", "Natural / Ambient", "Backlit / Silhouette"]
    }

    # Parse TSV
    with open(tsv_path, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f, delimiter="\t"))

    # Group QA into samples
    image_samples = {}
    for r in rows:
        cat = r.get("category", "").strip().lower()
        path_str = r.get("path", "[]")
        try:
            paths = ast.literal_eval(path_str)
            if not paths:
                continue
            rel_img = paths[0]
            full_img_path = images_dir / rel_img

            if rel_img not in image_samples:
                image_samples[rel_img] = {
                    "image_path": str(full_img_path),
                    "movie": rel_img.split("/")[0] if "/" in rel_img else "default"
                }

            # Map category to task
            options = json.loads(r.get("options", "{}"))
            ans_key = r.get("answer", "").strip()
            ans_label = options.get(ans_key, ans_key)

            if "shot size" in cat or "lens size" in cat or "framing" in cat:
                image_samples[rel_img]["shot_size"] = ans_label
            elif "angle" in cat:
                image_samples[rel_img]["camera_angle"] = ans_label
            elif "movement" in cat:
                image_samples[rel_img]["camera_movement"] = ans_label
            elif "composition" in cat:
                image_samples[rel_img]["composition"] = ans_label
            elif "lighting" in cat:
                image_samples[rel_img]["lighting"] = ans_label
        except Exception:
            continue

    sample_list = list(image_samples.values())
    print(f"[ShotBench MultiTask] Extracted {len(sample_list)} unified cinematography image samples.")

    # Split 70/15/15
    np.random.seed(42)
    np.random.shuffle(sample_list)
    n = len(sample_list)
    n_train = int(n * 0.70)
    n_val = int(n * 0.15)

    train_records = sample_list[:n_train]
    val_records = sample_list[n_train:n_train + n_val]
    test_records = sample_list[n_train + n_val:]

    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = ShotBenchMultiTaskDataset(train_records, head_classes, transform=train_tf)
    val_ds = ShotBenchMultiTaskDataset(val_records, head_classes, transform=val_tf)
    test_ds = ShotBenchMultiTaskDataset(test_records, head_classes, transform=val_tf)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader, head_classes


def train_multitask_model(epochs: int = 15, batch_size: int = 32, lr: float = 3e-4) -> Dict[str, Any]:
    train_loader, val_loader, test_loader, head_classes = prepare_shotbench_data(batch_size=batch_size)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = MultiTaskCinematographyCNN(
        backbone_name="efficientnet_b0",
        pretrained=True,
        head_classes=head_classes
    ).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    print(f"\n[MultiTaskCinematography] Training on {device.upper()} for {epochs} epochs...")
    start_time = time.time()
    best_val_f1 = 0.0
    best_weights = None

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        n_samples = 0
        for images, targets in train_loader:
            images = images.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            
            # Sum loss across all active heads
            loss = 0.0
            for task_name, logits in outputs.items():
                y = targets[task_name].to(device)
                loss += criterion(logits, y)
                
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * images.size(0)
            n_samples += images.size(0)

        scheduler.step()
        train_loss = total_loss / max(1, n_samples)

        # Validation
        model.eval()
        task_f1s = []
        with torch.no_grad():
            for task_name in head_classes.keys():
                preds, actuals = [], []
                for images, targets in val_loader:
                    images = images.to(device)
                    outputs = model(images)
                    p = torch.argmax(outputs[task_name], dim=-1).cpu().numpy()
                    preds.extend(p)
                    actuals.extend(targets[task_name].numpy())
                _, _, f1, _ = precision_recall_fscore_support(actuals, preds, average="macro", zero_division=0)
                task_f1s.append(f1)

        mean_val_f1 = float(np.mean(task_f1s))
        if mean_val_f1 > best_val_f1:
            best_val_f1 = mean_val_f1
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 3 == 0 or epoch == epochs:
            print(f"Epoch [{epoch:02d}/{epochs:02d}] Train Loss: {train_loss:.4f} | Mean Val F1: {mean_val_f1:.4f}", flush=True)

    if best_weights:
        model.load_state_dict(best_weights)

    # Test Evaluation per head
    model.eval()
    per_task_results = {}
    with torch.no_grad():
        for task_name, classes in head_classes.items():
            test_preds, test_actuals = [], []
            for images, targets in test_loader:
                images = images.to(device)
                outputs = model(images)
                p = torch.argmax(outputs[task_name], dim=-1).cpu().numpy()
                test_preds.extend(p)
                test_actuals.extend(targets[task_name].numpy())

            acc = float(accuracy_score(test_actuals, test_preds))
            prec, rec, f1, _ = precision_recall_fscore_support(test_actuals, test_preds, average="macro", zero_division=0)
            per_task_results[task_name] = {
                "accuracy": round(acc, 4),
                "macro_precision": round(float(prec), 4),
                "macro_recall": round(float(rec), 4),
                "macro_f1": round(float(f1), 4),
                "classes": classes
            }

    overall_results = {
        "model_name": "MultiTaskCinematographyCNN",
        "backbone": "efficientnet_b0",
        "dataset": "ShotBench (Apache 2.0)",
        "train_time_sec": round(time.time() - start_time, 2),
        "per_task_metrics": per_task_results
    }

    # Save checkpoint
    ckpt_dir = Path("ML_VIDEO/models/checkpoints")
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = ckpt_dir / "multitask_cinematography_best.pt"
    torch.save({
        "model_state_dict": model.state_dict(),
        "head_classes": head_classes,
        "metrics": overall_results
    }, ckpt_path)
    print(f"[MultiTaskCinematography] Checkpoint saved: {ckpt_path}", flush=True)

    # Save report
    rep_path = Path("ML_VIDEO/reports/multitask_cinematography_evaluation.json")
    with open(rep_path, "w", encoding="utf-8") as f:
        json.dump(overall_results, f, indent=2)
    print(f"[MultiTaskCinematography] Report saved: {rep_path}", flush=True)
    return overall_results


if __name__ == "__main__":
    train_multitask_model(epochs=15)
