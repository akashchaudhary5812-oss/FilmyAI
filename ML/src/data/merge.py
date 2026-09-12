import re
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root

logger = setup_logger("FilmyAI-Merge")

def map_hit_flop_to_class(raw_score: int) -> Tuple[str, int]:
    """
    Maps historical Bollywood hitFlop rating (1-9) to standard commercial category.
    1-2: Flop (0)
    3-4: Average (1)
    5-6: Hit (2)
    7-9: Super Hit (3)
    """
    try:
        val = int(raw_score)
    except (ValueError, TypeError):
        val = 1
        
    if val <= 2:
        return "Flop", 0
    elif val <= 4:
        return "Average", 1
    elif val <= 6:
        return "Hit", 2
    else:
        return "Super Hit", 3

def map_roi_to_class(roi: float) -> Tuple[str, int]:
    """
    Maps financial ROI (Revenue / Budget) to standardized commercial category.
    < 1.0: Flop (0)
    1.0 - 1.8: Average (1)
    1.8 - 3.5: Hit (2)
    >= 3.5: Super Hit (3)
    """
    if pd.isna(roi) or roi < 1.0:
        return "Flop", 0
    elif roi < 1.8:
        return "Average", 1
    elif roi < 3.5:
        return "Hit", 2
    else:
        return "Super Hit", 3

def build_unified_movie_dataset() -> pd.DataFrame:
    """
    Merges cleaned datasets with entity resolution, joins star rankings,
    computes prior track records, and creates unified pre-release feature matrix.
    """
    root = get_project_root()
    interim_dir = root / "data" / "interim"
    
    bmd = pd.read_parquet(interim_dir / "clean_bollywood_movies.parquet")
    act = pd.read_parquet(interim_dir / "clean_actor_rankings.parquet")
    direct = pd.read_parquet(interim_dir / "clean_director_rankings.parquet")
    fin = pd.read_parquet(interim_dir / "clean_financial_movies.parquet")
    
    logger.info(f"Loaded interim tables: BMD={len(bmd)}, Actors={len(act)}, Directors={len(direct)}, Fin={len(fin)}")
    
    # 1. Create Actor and Director Lookup Dictionaries
    actor_map = act.set_index("norm_name")[["actor_movie_count", "actor_normalized_rating", "actor_google_hits"]].to_dict(orient="index")
    director_map = direct.set_index("norm_name")[["director_movie_count", "director_normalized_rating", "director_google_hits"]].to_dict(orient="index")
    
    # 2. Enrich BMD with Actor / Director Star Power
    def get_cast_metrics(actors_str: str) -> Tuple[float, float, float, int]:
        if not isinstance(actors_str, str) or not actors_str.strip():
            return 0.0, 0.0, 0.0, 0
        names = [re.sub(r'[^a-z0-9]', '', n.lower().strip()) for n in re.split(r'[,|]', actors_str) if n.strip()]
        if not names:
            return 0.0, 0.0, 0.0, 0
        
        star_ratings = []
        google_hits = []
        movie_counts = []
        known_count = 0
        
        for n in names:
            if n in actor_map:
                known_count += 1
                star_ratings.append(actor_map[n]["actor_normalized_rating"])
                google_hits.append(actor_map[n]["actor_google_hits"])
                movie_counts.append(actor_map[n]["actor_movie_count"])
                
        lead_star_rating = star_ratings[0] if star_ratings else 0.0
        avg_star_rating = np.mean(star_ratings) if star_ratings else 0.0
        max_google_hits = np.max(google_hits) if google_hits else 0.0
        
        return lead_star_rating, avg_star_rating, max_google_hits, known_count

    def get_director_metrics(directors_str: str) -> Tuple[float, float, int]:
        if not isinstance(directors_str, str) or not directors_str.strip():
            return 0.0, 0.0, 0
        names = [re.sub(r'[^a-z0-9]', '', n.lower().strip()) for n in re.split(r'[,|]', directors_str) if n.strip()]
        if not names:
            return 0.0, 0.0, 0
            
        ratings = []
        google_hits = []
        known_count = 0
        
        for n in names:
            if n in director_map:
                known_count += 1
                ratings.append(director_map[n]["director_normalized_rating"])
                google_hits.append(director_map[n]["director_google_hits"])
                
        director_rating = np.max(ratings) if ratings else 0.0
        director_hits = np.max(google_hits) if google_hits else 0.0
        return director_rating, director_hits, known_count

    bmd_cast = bmd["clean_actors"].apply(get_cast_metrics)
    bmd["lead_actor_rating"] = bmd_cast.apply(lambda x: x[0])
    bmd["avg_cast_rating"] = bmd_cast.apply(lambda x: x[1])
    bmd["cast_google_hits"] = bmd_cast.apply(lambda x: x[2])
    bmd["known_actors_count"] = bmd_cast.apply(lambda x: x[3])
    
    bmd_dir = bmd["clean_directors"].apply(get_director_metrics)
    bmd["director_rating"] = bmd_dir.apply(lambda x: x[0])
    bmd["director_google_hits"] = bmd_dir.apply(lambda x: x[1])
    bmd["known_director_count"] = bmd_dir.apply(lambda x: x[2])
    
    # 3. Add Safe Target Mapping
    class_info = bmd["raw_hit_flop"].apply(map_hit_flop_to_class)
    bmd["commercial_class_name"] = class_info.apply(lambda x: x[0])
    bmd["commercial_class_label"] = class_info.apply(lambda x: x[1])
    bmd["is_commercial_hit"] = (bmd["commercial_class_label"] >= 2).astype(int)
    
    # 4. Merge Financial Information where available
    fin_sub = fin[["norm_title", "release_year", "budget_usd", "revenue_usd", "orig_lang", "country"]].copy()
    bmd = pd.merge(bmd, fin_sub, on=["norm_title", "release_year"], how="left")
    
    # Impute missing budget/revenue
    bmd["budget_usd"] = bmd["budget_usd"].fillna(0)
    bmd["revenue_usd"] = bmd["revenue_usd"].fillna(0)
    bmd["orig_lang"] = bmd["orig_lang"].fillna("hi")
    bmd["country"] = bmd["country"].fillna("IND")
    
    # Calculate ROI where budget > 0
    bmd["roi"] = np.where(bmd["budget_usd"] > 0, bmd["revenue_usd"] / bmd["budget_usd"], np.nan)
    
    # Sort temporally for safe split and prior feature calculations
    bmd = bmd.sort_values(by=["release_year", "release_month", "title"]).reset_index(drop=True)
    
    logger.info(f"Unified Movie Dataset constructed: {bmd.shape}")
    logger.info(f"Target Class Distribution:\n{bmd['commercial_class_name'].value_counts()}")
    
    # Save unified interim table
    bmd.to_parquet(interim_dir / "unified_movie_dataset.parquet", index=False)
    return bmd

if __name__ == "__main__":
    build_unified_movie_dataset()
