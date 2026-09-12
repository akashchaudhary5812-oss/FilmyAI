import pytest
import pandas as pd
import numpy as np
from ML.src.features.genre_features import extract_genre_features
from ML.src.features.temporal_features import extract_temporal_features
from ML.src.features.cast_features import compute_historical_actor_track_records
from ML.src.features.pipeline import create_temporal_splits

def test_genre_extraction():
    dummy_df = pd.DataFrame({
        "clean_genre": ["Action, Comedy", "Drama", "Sci-Fi, Thriller", ""]
    })
    gf = extract_genre_features(dummy_df)
    assert "genre_action" in gf.columns
    assert "genre_comedy" in gf.columns
    assert gf.loc[0, "genre_action"] == 1
    assert gf.loc[0, "genre_comedy"] == 1
    assert gf.loc[1, "genre_action"] == 0
    assert gf.loc[0, "is_multi_genre"] == 1

def test_temporal_features():
    dummy_df = pd.DataFrame({
        "release_year": [2005, 2012, 2024],
        "release_month": [12, 5, 2]
    })
    tf = extract_temporal_features(dummy_df)
    assert tf.loc[0, "is_q4"] == 1
    assert tf.loc[0, "is_festive_quarter"] == 1
    assert tf.loc[1, "is_q2"] == 1
    assert tf.loc[2, "is_q1"] == 1

def test_zero_leakage_temporal_split():
    dummy_df = pd.DataFrame({
        "release_year": [2005, 2008, 2011, 2012, 2013, 2014],
        "feature_1": [1, 2, 3, 4, 5, 6]
    })
    X = dummy_df[["feature_1"]]
    y_class = pd.Series([0, 1, 0, 1, 2, 3])
    y_reg = pd.Series([1.0, 3.0, 2.0, 4.0, 6.0, 7.0])
    
    splits = create_temporal_splits(dummy_df, X, y_class, y_reg, train_end_year=2010, val_end_year=2012)
    
    train_x, _, _ = splits["train"]
    val_x, _, _ = splits["val"]
    test_x, _, _ = splits["test"]
    
    assert len(train_x) == 2
    assert len(val_x) == 2
    assert len(test_x) == 2
