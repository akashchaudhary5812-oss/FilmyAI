import re
import pandas as pd
import numpy as np
from typing import List, Dict

COMMON_GENRES = [
    "action", "adventure", "animation", "biography", "comedy", "crime",
    "documentary", "drama", "family", "fantasy", "history", "horror",
    "music", "musical", "mystery", "romance", "sci-fi", "sport", "thriller", "war"
]

def extract_genre_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts multi-hot genre representations and primary genre.
    """
    res = pd.DataFrame(index=df.index)
    
    genres_series = df["clean_genre"].fillna("").astype(str).str.lower()
    
    for g in COMMON_GENRES:
        # Match word boundary or separated tokens
        res[f"genre_{g}"] = genres_series.apply(lambda text: 1 if g in text else 0)
        
    res["genre_count"] = res[[f"genre_{g}" for g in COMMON_GENRES]].sum(axis=1)
    res["is_multi_genre"] = (res["genre_count"] > 1).astype(int)
    
    # Primary genre (first listed)
    def get_primary_genre(text: str) -> str:
        tokens = [t.strip() for t in re.split(r'[,|/]', text) if t.strip()]
        for t in tokens:
            for g in COMMON_GENRES:
                if g in t:
                    return g
        return "drama"
        
    res["primary_genre"] = genres_series.apply(get_primary_genre)
    return res
