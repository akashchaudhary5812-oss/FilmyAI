from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, HistGradientBoostingRegressor
from typing import Dict, Any
import xgboost as xgb
import lightgbm as lgb

def get_advanced_regressors(random_state: int = 42) -> Dict[str, Any]:
    """Returns advanced regression models for continuous commercial potential prediction."""
    models = {
        "Random_Forest_Regressor": RandomForestRegressor(
            n_estimators=200,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        ),
        "Gradient_Boosting_Regressor": GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=4,
            random_state=random_state
        ),
        "Hist_Gradient_Boosting_Regressor": HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.05,
            max_depth=5,
            random_state=random_state
        ),
        "XGBoost_Regressor": xgb.XGBRegressor(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state
        ),
        "LightGBM_Regressor": lgb.LGBMRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            random_state=random_state,
            verbosity=-1
        )
    }
    return models
