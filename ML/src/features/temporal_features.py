import pandas as pd
import numpy as np

def extract_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts time-based features from release_year and release_month.
    Pre-release safe: Release schedule is determined prior to release.
    """
    res = pd.DataFrame(index=df.index)
    
    year = df["release_year"].fillna(2000).astype(int)
    month = df["release_month"].fillna(0).astype(int)
    
    res["release_year_norm"] = (year - 2000) / 25.0
    res["is_2000s"] = ((year >= 2000) & (year < 2010)).astype(int)
    res["is_2010s"] = ((year >= 2010) & (year < 2020)).astype(int)
    
    # Seasonality
    res["release_month"] = month
    res["is_q1"] = ((month >= 1) & (month <= 3)).astype(int)
    res["is_q2"] = ((month >= 4) & (month <= 6)).astype(int)
    res["is_q3"] = ((month >= 7) & (month <= 9)).astype(int)
    res["is_q4"] = ((month >= 10) & (month <= 12)).astype(int)
    
    # Major Bollywood festive release windows (Eid/Diwali/Christmas: typically Oct, Nov, Dec, and festive mid-year)
    res["is_festive_quarter"] = res["is_q4"]
    
    return res
