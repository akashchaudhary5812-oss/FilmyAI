import re
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

def compute_historical_actor_track_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes prior historical career statistics for actors strictly before each movie's release year.
    Zero-leakage guarantee: Movie at year Y only accesses data from years < Y.
    """
    res = pd.DataFrame(index=df.index)
    
    # Base star ranking metrics
    res["lead_actor_rating"] = df["lead_actor_rating"].fillna(0.0)
    res["avg_cast_rating"] = df["avg_cast_rating"].fillna(0.0)
    res["cast_google_hits"] = np.log1p(df["cast_google_hits"].fillna(0.0))
    res["known_actors_count"] = df["known_actors_count"].fillna(0).astype(int)
    
    # Compute expanding prior success rate per actor
    # Build a timeline of actor appearances: actor -> [(year, is_hit)]
    actor_history: Dict[str, List[Tuple[int, int]]] = {}
    
    # Sort by release_year
    sorted_indices = df.sort_values(by=["release_year", "release_month"]).index
    
    prior_lead_success_rate = {}
    prior_lead_movie_count = {}
    
    for idx in sorted_indices:
        row = df.loc[idx]
        y = int(row["release_year"]) if pd.notna(row["release_year"]) else 2000
        actors_str = str(row.get("clean_actors", ""))
        lead_actor = re.split(r'[,|]', actors_str)[0].strip().lower() if actors_str else ""
        
        # Calculate prior stats for lead actor
        if lead_actor and lead_actor in actor_history:
            past_records = [hit for (pyr, hit) in actor_history[lead_actor] if pyr < y]
            if past_records:
                prior_lead_success_rate[idx] = float(np.mean(past_records))
                prior_lead_movie_count[idx] = len(past_records)
            else:
                prior_lead_success_rate[idx] = 0.0
                prior_lead_movie_count[idx] = 0
        else:
            prior_lead_success_rate[idx] = 0.0
            prior_lead_movie_count[idx] = 0
            
        # Update history with current movie outcome
        is_hit = int(row.get("is_commercial_hit", 0))
        if lead_actor:
            if lead_actor not in actor_history:
                actor_history[lead_actor] = []
            actor_history[lead_actor].append((y, is_hit))
            
    res["lead_actor_prior_success_rate"] = pd.Series(prior_lead_success_rate)
    res["lead_actor_prior_movies"] = pd.Series(prior_lead_movie_count)
    
    # Star power interaction
    res["star_power_composite"] = res["lead_actor_rating"] * (1.0 + res["lead_actor_prior_success_rate"])
    
    return res
