import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, List
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from ML.src.features.temporal_features import extract_temporal_features
from ML.src.features.genre_features import extract_genre_features
from ML.src.features.cast_features import compute_historical_actor_track_records
from ML.src.features.director_features import compute_historical_director_track_records
from ML.src.features.movie_features import extract_movie_metadata_features
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root, load_config
from ML.src.utils.helpers import save_artifact

logger = setup_logger("FilmyAI-FeaturePipeline")

def build_full_feature_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Constructs leak-free feature matrix, classification target, and regression target.
    """
    f_temporal = extract_temporal_features(df)
    f_genre = extract_genre_features(df)
    f_cast = compute_historical_actor_track_records(df)
    f_director = compute_historical_director_track_records(df)
    f_movie = extract_movie_metadata_features(df)
    
    # Drop string primary_genre from numerical matrix (or one-hot it)
    primary_genre_dummies = pd.get_dummies(f_genre["primary_genre"], prefix="pgenre", drop_first=False)
    f_genre_clean = f_genre.drop(columns=["primary_genre"])
    
    X = pd.concat([
        f_movie,
        f_temporal,
        f_genre_clean,
        primary_genre_dummies,
        f_cast,
        f_director
    ], axis=1)
    
    # Target variables
    y_class = df["commercial_class_label"] # 0: Flop, 1: Average, 2: Hit, 3: Super Hit
    y_reg = df["raw_hit_flop"].astype(float) # 1.0 to 9.0 rating scale
    
    logger.info(f"Built full feature matrix: X={X.shape}, y_class={y_class.shape}")
    return X, y_class, y_reg

def create_temporal_splits(
    df: pd.DataFrame,
    X: pd.DataFrame,
    y_class: pd.Series,
    y_reg: pd.Series,
    train_end_year: int = 2010,
    val_end_year: int = 2012
) -> Dict[str, Tuple[pd.DataFrame, pd.Series, pd.Series]]:
    """
    Performs strict temporal splitting:
    Train: <= train_end_year
    Val: train_end_year < year <= val_end_year
    Test: > val_end_year
    """
    years = df["release_year"].fillna(2000).astype(int)
    
    train_mask = (years <= train_end_year)
    val_mask = ((years > train_end_year) & (years <= val_end_year))
    test_mask = (years > val_end_year)
    
    splits = {
        "train": (X[train_mask].copy(), y_class[train_mask].copy(), y_reg[train_mask].copy()),
        "val": (X[val_mask].copy(), y_class[val_mask].copy(), y_reg[val_mask].copy()),
        "test": (X[test_mask].copy(), y_class[test_mask].copy(), y_reg[test_mask].copy())
    }
    
    logger.info(f"Temporal Splits Created: Train={len(splits['train'][0])} (<= {train_end_year}), Val={len(splits['val'][0])} ({train_end_year+1}-{val_end_year}), Test={len(splits['test'][0])} (> {val_end_year})")
    return splits

def run_feature_pipeline() -> Dict[str, Any]:
    """Runs complete feature engineering workflow and persists processed datasets."""
    root = get_project_root()
    interim_dir = root / "data" / "interim"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_parquet(interim_dir / "unified_movie_dataset.parquet")
    X, y_class, y_reg = build_full_feature_matrix(df)
    
    splits = create_temporal_splits(df, X, y_class, y_reg, train_end_year=2010, val_end_year=2012)
    
    # Fit preprocessor strictly on train split to prevent preprocessing leakage
    X_train, y_class_train, y_reg_train = splits["train"]
    X_val, y_class_val, y_reg_val = splits["val"]
    X_test, y_class_test, y_reg_test = splits["test"]
    
    # Align all column structures across splits
    all_cols = list(X.columns)
    for s_name, (s_X, _, _) in splits.items():
        for col in all_cols:
            if col not in s_X.columns:
                s_X[col] = 0
        s_X = s_X[all_cols]
        
    scaler_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    scaler_pipeline.fit(X_train)
    save_artifact(scaler_pipeline, root / "models" / "preprocessors" / "feature_scaler.joblib")
    save_artifact(all_cols, root / "models" / "preprocessors" / "feature_names.joblib")
    
    # Save processed splits
    for name, (s_x, s_yc, s_yr) in splits.items():
        s_x.to_parquet(processed_dir / f"X_{name}.parquet")
        s_yc.to_frame(name="target_class").to_parquet(processed_dir / f"y_class_{name}.parquet")
        s_yr.to_frame(name="target_reg").to_parquet(processed_dir / f"y_reg_{name}.parquet")
        
    logger.info("Processed datasets & preprocessing pipeline successfully persisted.")
    return {
        "splits": splits,
        "feature_names": all_cols,
        "preprocessor": scaler_pipeline
    }

if __name__ == "__main__":
    from typing import Any
    run_feature_pipeline()
