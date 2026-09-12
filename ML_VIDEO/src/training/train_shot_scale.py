"""
Comparative Training & Benchmarking Suite for Shot-Scale Classification.
Trains and compares:
1. CinematicShotCNN (Custom Baseline)
2. ResNet-18 (Residual Transfer Baseline)
3. EfficientNet-B0 (Champion Transfer Model)

Evaluates on real data test split and saves checkpoints + full metric reports.
"""
import time
import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from ML_VIDEO.src.models.dataset import get_shot_data_loaders
from ML_VIDEO.src.models.shot_classifier import CinematicShotCNN
from ML_VIDEO.src.models.resnet_shot import ResNetShotClassifier
from ML_VIDEO.src.models.efficientnet_shot import EfficientNetShotClassifier


def train_single_model(
    model: nn.Module,
    model_name: str,
    train_loader,
    val_loader,
    test_loader,
    class_names: List[str],
    epochs: int = 15,
    lr: float = 3e-4,
    device: str = "cpu"
) -> Dict[str, Any]:
    print(f"\n{'='*60}")
    print(f"TRAINING: {model_name} on {device.upper()}")
    print(f"{'='*60}")
    
    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_f1 = 0.0
    best_weights = None
    history = {"train_loss": [], "val_loss": [], "val_acc": [], "val_f1": []}

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        # --- TRAIN ---
        model.train()
        total_loss = 0.0
        n_train = 0
        for images, labels, _ in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item() * images.size(0)
            n_train += images.size(0)
            
        scheduler.step()
        train_loss = total_loss / n_train

        # --- VALIDATION ---
        model.eval()
        val_loss = 0.0
        n_val = 0
        all_preds = []
        all_targets = []
        with torch.no_grad():
            for images, labels, _ in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                n_val += images.size(0)
                
                preds = torch.argmax(outputs, dim=-1).cpu().numpy()
                all_preds.extend(preds)
                all_targets.extend(labels.cpu().numpy())

        val_loss /= n_val
        val_acc = accuracy_score(all_targets, all_preds)
        _, _, val_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='macro', zero_division=0)

        history["train_loss"].append(round(train_loss, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 4))
        history["val_f1"].append(round(val_f1, 4))

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 3 == 0 or epoch == epochs:
            print(f"Epoch [{epoch:02d}/{epochs:02d}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.1f}% | Val F1: {val_f1:.4f}", flush=True)

    train_duration = round(time.time() - start_time, 2)
    print(f"[{model_name}] Training complete in {train_duration}s. Best Val F1: {best_val_f1:.4f}", flush=True)

    # Load best weights for test evaluation
    if best_weights is not None:
        model.load_state_dict(best_weights)

    # --- TEST EVALUATION ---
    model.eval()
    test_preds = []
    test_targets = []
    with torch.no_grad():
        for images, labels, _ in test_loader:
            images = images.to(device)
            outputs = model(images)
            preds = torch.argmax(outputs, dim=-1).cpu().numpy()
            test_preds.extend(preds)
            test_targets.extend(labels.numpy())

    test_acc = float(accuracy_score(test_targets, test_preds))
    prec, rec, f1, _ = precision_recall_fscore_support(test_targets, test_preds, average='macro', zero_division=0)
    conf_mat = confusion_matrix(test_targets, test_preds).tolist()

    # Per-class report
    per_class_p, per_class_r, per_class_f1, per_class_sup = precision_recall_fscore_support(
        test_targets, test_preds, average=None, zero_division=0
    )
    per_class_metrics = {}
    for i, name in enumerate(class_names):
        if i < len(per_class_p):
            per_class_metrics[name] = {
                "precision": round(float(per_class_p[i]), 4),
                "recall": round(float(per_class_r[i]), 4),
                "f1": round(float(per_class_f1[i]), 4),
                "support": int(per_class_sup[i])
            }

    results = {
        "model_name": model_name,
        "epochs": epochs,
        "train_time_sec": train_duration,
        "test_accuracy": round(test_acc, 4),
        "test_macro_precision": round(float(prec), 4),
        "test_macro_recall": round(float(rec), 4),
        "test_macro_f1": round(float(f1), 4),
        "per_class": per_class_metrics,
        "confusion_matrix": conf_mat,
        "history": history
    }

    # Save checkpoint
    ckpt_dir = Path("ML_VIDEO/models/checkpoints")
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = ckpt_dir / f"{model_name.lower().replace(' ', '_')}_best.pt"
    torch.save({
        "model_state_dict": model.state_dict(),
        "classes": class_names,
        "metrics": results
    }, ckpt_path)
    print(f"[{model_name}] Checkpoint saved: {ckpt_path}")
    results["checkpoint_path"] = str(ckpt_path)

    return results


def run_benchmark_suite(epochs: int = 15, batch_size: int = 32) -> Dict[str, Any]:
    """
    Executes full comparative training and evaluation on all 3 architectures.
    """
    train_loader, val_loader, test_loader, class_names = get_shot_data_loaders(batch_size=batch_size)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Running benchmarks on {device.upper()} | Classes: {class_names}")

    models_to_test = [
        ("CinematicShotCNN", CinematicShotCNN(num_classes=len(class_names))),
        ("ResNet18", ResNetShotClassifier(num_classes=len(class_names), pretrained=True)),
        ("EfficientNetB0", EfficientNetShotClassifier(num_classes=len(class_names), pretrained=True))
    ]

    all_results = {}
    for name, model_instance in models_to_test:
        res = train_single_model(
            model=model_instance,
            model_name=name,
            train_loader=train_loader,
            val_loader=val_loader,
            test_loader=test_loader,
            class_names=class_names,
            epochs=epochs,
            device=device
        )
        all_results[name] = res

    # Summary comparison
    print("\n" + "="*80)
    print("BENCHMARK COMPARISON SUMMARY")
    print("="*80)
    print(f"{'Model':<20} | {'Test Acc':<10} | {'Macro Precision':<16} | {'Macro Recall':<14} | {'Macro F1':<10} | {'Train Time':<10}")
    print("-"*80)
    for name, r in all_results.items():
        print(f"{name:<20} | {r['test_accuracy']*100:>8.2f}% | {r['test_macro_precision']:>16.4f} | {r['test_macro_recall']:>14.4f} | {r['test_macro_f1']:>10.4f} | {r['train_time_sec']:>8.1f}s")
    print("="*80)

    # Save summary report
    report_dir = Path("ML_VIDEO/reports")
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / "shot_scale_benchmark_results.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print(f"Benchmark report saved to: {report_path}")

    return all_results


if __name__ == "__main__":
    run_benchmark_suite(epochs=12, batch_size=32)
