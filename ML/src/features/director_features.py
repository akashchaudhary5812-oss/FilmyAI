import re
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

def compute_historical_director_track_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes prior historical career statistics for directors strictly before each movie's release year.
    Zero-leakage guarantee: Movie at year Y only accesses data from years < Y.
    """
    res = pd.DataFrame(index=df.index)
    
    # Base director rankings
    res["director_rating"] = df["director_rating"].fillna(0.0)
    res["director_google_hits"] = np.log1p(df["director_google_hits"].fillna(0.0))
    res["has_known_director"] = (df["known_director_count"].fillna(0) > 0).astype(int)
    
    # Expanding prior track record
    director_history: Dict[str, List[Tuple[int, int]]] = {}
    sorted_indices = df.sort_values(by=["release_year", "release_month"]).index
    
    prior_dir_success_rate = {}
    prior_dir_movie_count = {}
    
    for idx in sorted_indices:
        row = df.loc[idx]
        y = int(row["release_year"]) if pd.notna(row["release_year"]) else 2000
        dirs_str = str(row.get("clean_directors", ""))
        lead_dir = re.split(r'[,|]', dirs_str)[0].strip().lower() if dirs_str else ""
        
        if lead_dir and lead_dir in director_history:
            past_records = [hit for (pyr, hit) in director_history[lead_dir] if pyr < y]
            if past_records:
                prior_dir_success_rate[idx] = float(np.mean(past_records))
                prior_dir_movie_count[idx] = len(past_records)
            else:
                prior_dir_success_rate[idx] = 0.0
                prior_dir_movie_count[idx] = 0
        else:
            prior_dir_success_rate[idx] = 0.0
            prior_dir_movie_count[idx] = 0
            
        # Update history
        is_hit = int(row.get("is_commercial_hit", 0))
        if lead_dir:
            if lead_dir not in director_history:
                director_history[lead_dir] = []
            director_history[lead_dir].append((y, is_hit))
            
    res["director_prior_success_rate"] = pd.Series(prior_dir_success_rate)
    res["director_prior_movies"] = pd.Series(prior_dir_movie_count)
    res["director_composite_score"] = res["director_rating"] * (1.0 + res["director_prior_success_rate"])
    
    return res
