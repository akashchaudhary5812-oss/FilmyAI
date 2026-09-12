from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.linear_model import LogisticRegression, Ridge, LinearRegression
from typing import Dict, Any

def get_baseline_classifiers(random_state: int = 42) -> Dict[str, Any]:
    """Returns baseline classification models."""
    return {
        "Majority_Class_Baseline": DummyClassifier(strategy="most_frequent"),
        "Uniform_Random_Baseline": DummyClassifier(strategy="uniform", random_state=random_state),
        "Logistic_Regression_Weighted": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=random_state
        )
    }

def get_baseline_regressors(random_state: int = 42) -> Dict[str, Any]:
    """Returns baseline regression models."""
    return {
        "Mean_Regressor_Baseline": DummyRegressor(strategy="mean"),
        "Median_Regressor_Baseline": DummyRegressor(strategy="median"),
        "Linear_Regression": LinearRegression(),
        "Ridge_Regression": Ridge(alpha=1.0, random_state=random_state)
    }
