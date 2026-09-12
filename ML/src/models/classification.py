from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from typing import Dict, Any
import xgboost as xgb
import lightgbm as lgb

def get_advanced_classifiers(random_state: int = 42) -> Dict[str, Any]:
    """Returns advanced tree-based and boosting classification models."""
    models = {
        "Random_Forest_Balanced": RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1
        ),
        "Gradient_Boosting": GradientBoostingClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=4,
            random_state=random_state
        ),
        "Hist_Gradient_Boosting_Balanced": HistGradientBoostingClassifier(
            max_iter=150,
            learning_rate=0.05,
            max_depth=5,
            class_weight="balanced",
            random_state=random_state
        ),
        "XGBoost_Classifier": xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            eval_metric="mlogloss"
        ),
        "LightGBM_Classifier_Balanced": lgb.LGBMClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            class_weight="balanced",
            random_state=random_state,
            verbosity=-1
        )
    }
    return models
