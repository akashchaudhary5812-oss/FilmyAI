import numpy as np
import torch
from typing import Dict, Any, List
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_probs: np.ndarray = None) -> Dict[str, Any]:
    """Computes comprehensive multi-class evaluation metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()
    
    top2_acc = None
    if y_probs is not None:
        top2_preds = np.argsort(y_probs, axis=1)[:, -2:]
        top2_correct = [y_true[i] in top2_preds[i] for i in range(len(y_true))]
        top2_acc = float(np.mean(top2_correct))
        
    return {
        "accuracy": acc,
        "top2_accuracy": top2_acc,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "confusion_matrix": cm
    }
