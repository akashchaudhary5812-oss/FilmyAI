import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor
import xgboost as xgb
import lightgbm as lgb
from typing import Dict, Any, Tuple
from ML.src.utils.logging import setup_logger

logger = setup_logger("FilmyAI-Tuning")

def tune_classification_model(X_train: pd.DataFrame, y_train: pd.Series, model_type: str = "xgboost", n_iter: int = 15, random_state: int = 42) -> Tuple[Any, Dict[str, Any], float]:
    """Tunes classification model hyperparameters using TimeSeries cross-validation."""
    tscv = TimeSeriesSplit(n_splits=3)
    
    if model_type == "xgboost":
        estimator = xgb.XGBClassifier(random_state=random_state, eval_metric="mlogloss")
        param_dist = {
            "n_estimators": [100, 150, 200, 300],
            "max_depth": [3, 4, 5, 6],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "subsample": [0.6, 0.8, 1.0],
            "colsample_bytree": [0.6, 0.8, 1.0],
            "min_child_weight": [1, 3, 5]
        }
    elif model_type == "random_forest":
        estimator = RandomForestClassifier(class_weight="balanced", random_state=random_state, n_jobs=-1)
        param_dist = {
            "n_estimators": [100, 200, 300],
            "max_depth": [4, 6, 8, 10, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "max_features": ["sqrt", "log2", None]
        }
    else:
        estimator = lgb.LGBMClassifier(class_weight="balanced", random_state=random_state, verbosity=-1)
        param_dist = {
            "n_estimators": [100, 150, 250],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.01, 0.05, 0.1],
            "num_leaves": [15, 31, 63]
        }
        
    search = RandomizedSearchCV(
        estimator=estimator,
        param_distributions=param_dist,
        n_iter=n_iter,
        cv=tscv,
        scoring="f1_weighted",
        random_state=random_state,
        n_jobs=-1
    )
    
    logger.info(f"Starting RandomizedSearchCV for classifier '{model_type}' (n_iter={n_iter})...")
    search.fit(X_train, y_train)
    logger.info(f"Best Classifier ({model_type}) Params: {search.best_params_}, Best CV Score: {search.best_score_:.4f}")
    
    return search.best_estimator_, search.best_params_, float(search.best_score_)

def tune_regression_model(X_train: pd.DataFrame, y_train: pd.Series, model_type: str = "xgboost", n_iter: int = 15, random_state: int = 42) -> Tuple[Any, Dict[str, Any], float]:
    """Tunes regression model hyperparameters using TimeSeries cross-validation."""
    tscv = TimeSeriesSplit(n_splits=3)
    
    if model_type == "xgboost":
        estimator = xgb.XGBRegressor(random_state=random_state)
        param_dist = {
            "n_estimators": [100, 150, 200, 300],
            "max_depth": [3, 4, 5, 6],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "subsample": [0.6, 0.8, 1.0],
            "colsample_bytree": [0.6, 0.8, 1.0]
        }
    else:
        estimator = RandomForestRegressor(random_state=random_state, n_jobs=-1)
        param_dist = {
            "n_estimators": [100, 200, 300],
            "max_depth": [4, 6, 8, 10, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4]
        }
        
    search = RandomizedSearchCV(
        estimator=estimator,
        param_distributions=param_dist,
        n_iter=n_iter,
        cv=tscv,
        scoring="neg_root_mean_squared_error",
        random_state=random_state,
        n_jobs=-1
    )
    
    logger.info(f"Starting RandomizedSearchCV for regressor '{model_type}' (n_iter={n_iter})...")
    search.fit(X_train, y_train)
    logger.info(f"Best Regressor ({model_type}) Params: {search.best_params_}, Best CV Score: {search.best_score_:.4f}")
    
    return search.best_estimator_, search.best_params_, float(search.best_score_)
