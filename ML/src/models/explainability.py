import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.inspection import permutation_importance
import shap
from pathlib import Path
from typing import Dict, Any

from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root
from ML.src.utils.helpers import load_artifact

logger = setup_logger("FilmyAI-Explainability")

def generate_model_explanations() -> Dict[str, Any]:
    """Generates feature importance, permutation importance, and SHAP analyses for FilmyAI models."""
    root = get_project_root()
    processed_dir = root / "data" / "processed"
    reports_final_dir = root / "reports" / "final"
    reports_final_dir.mkdir(parents=True, exist_ok=True)
    
    X_train = pd.read_parquet(processed_dir / "X_train.parquet")
    X_test = pd.read_parquet(processed_dir / "X_test.parquet")
    yc_test = pd.read_parquet(processed_dir / "y_class_test.parquet")["target_class"]
    yr_test = pd.read_parquet(processed_dir / "y_reg_test.parquet")["target_reg"]
    
    clf_model = load_artifact(root / "models" / "classification" / "champion_classifier.joblib")
    reg_model = load_artifact(root / "models" / "regression" / "champion_regressor.joblib")
    
    feature_names = list(X_train.columns)
    
    # 1. Classification Feature Importance / Coefficients
    if hasattr(clf_model, "feature_importances_"):
        clf_imp = pd.Series(clf_model.feature_importances_, index=feature_names)
    elif hasattr(clf_model, "coef_"):
        # Average absolute magnitude across classes
        clf_imp = pd.Series(np.mean(np.abs(clf_model.coef_), axis=0), index=feature_names)
    else:
        clf_imp = pd.Series(0, index=feature_names)
        
    top_clf_features = clf_imp.sort_values(ascending=False).head(15)
    
    # 2. Regression Feature Importance (XGBoost / Tree)
    if hasattr(reg_model, "feature_importances_"):
        reg_imp = pd.Series(reg_model.feature_importances_, index=feature_names)
    elif hasattr(reg_model, "coef_"):
        reg_imp = pd.Series(np.abs(reg_model.coef_), index=feature_names)
    else:
        reg_imp = pd.Series(0, index=feature_names)
        
    top_reg_features = reg_imp.sort_values(ascending=False).head(15)
    
    # 3. Permutation Importance on Test Set
    logger.info("Computing Permutation Importance on Holdout Test Set...")
    perm_result = permutation_importance(reg_model, X_test, yr_test, n_repeats=10, random_state=42, n_jobs=-1)
    perm_imp = pd.Series(perm_result.importances_mean, index=feature_names).sort_values(ascending=False).head(15)
    
    # 4. Plot Feature Importances
    plt.figure(figsize=(10, 6))
    top_reg_features.sort_values().plot(kind="barh", color="#1f77b4")
    plt.title("FilmyAI — Top 15 Commercial Potential Feature Importances (XGBoost Regressor)", fontsize=12, fontweight="bold")
    plt.xlabel("Importance Score")
    plt.tight_layout()
    plt.savefig(reports_final_dir / "feature_importance_regression.png", dpi=300)
    plt.close()
    
    plt.figure(figsize=(10, 6))
    perm_imp.sort_values().plot(kind="barh", color="#2ca02c")
    plt.title("FilmyAI — Top 15 Permutation Importance on Future Holdout Test Set", fontsize=12, fontweight="bold")
    plt.xlabel("Mean Accuracy/R² Decrease upon Shuffling")
    plt.tight_layout()
    plt.savefig(reports_final_dir / "permutation_importance.png", dpi=300)
    plt.close()
    
    # 5. SHAP Analysis on Tree Model
    logger.info("Computing Tree SHAP values...")
    try:
        explainer = shap.TreeExplainer(reg_model)
        shap_values = explainer.shap_values(X_test)
        
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_test, feature_names=feature_names, show=False, max_display=12)
        plt.title("FilmyAI — SHAP Summary Plot for Commercial Potential", fontsize=12, fontweight="bold")
        plt.tight_layout()
        plt.savefig(reports_final_dir / "shap_summary_plot.png", dpi=300)
        plt.close()
    except Exception as e:
        logger.warning(f"SHAP tree computation note: {e}")
        
    explanation_summary = {
        "top_classification_features": top_clf_features.to_dict(),
        "top_regression_features": top_reg_features.to_dict(),
        "top_permutation_features": perm_imp.to_dict()
    }
    
    with open(reports_final_dir / "explainability_summary.json", "w", encoding="utf-8") as f:
        json.dump(explanation_summary, f, indent=2)
        
    logger.info("Explainability report and charts generated under ML/reports/final/")
    return explanation_summary

if __name__ == "__main__":
    generate_model_explanations()
