import re
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple
from ML.src.data.load import load_raw_csv_files
from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root

logger = setup_logger("FilmyAI-Clean")

def normalize_text(text: str) -> str:
    """Cleans whitespace, lowercases, removes non-alphanumeric punctuation except standard delimiters."""
    if not isinstance(text, str) or pd.isna(text):
        return ""
    text = text.lower().strip()
    # Normalize unicode / special quotes
    text = re.sub(r'[\u2018\u2019\u201c\u201d"]', '', text)
    # Remove excessive punctuation
    text = re.sub(r'[^\w\s\-,|]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_title(title: str) -> str:
    """Strict title normalizer for entity resolution."""
    if not isinstance(title, str) or pd.isna(title):
        return ""
    title = title.lower().strip()
    title = re.sub(r'[^a-z0-9]', '', title)
    return title

def parse_release_date(date_str: str) -> Tuple[int, int, int]:
    """Extracts (year, month, day) from varied date string formats."""
    if not isinstance(date_str, str) or pd.isna(date_str) or not date_str.strip():
        return (0, 0, 0)
    try:
        dt = pd.to_datetime(date_str, format="mixed", errors="coerce")
        if pd.notna(dt):
            return (int(dt.year), int(dt.month), int(dt.day))
    except Exception:
        pass
    # Fallback regex search for 4 digit year
    m = re.search(r'\b(19\d\d|20\d\d)\b', str(date_str))
    year = int(m.group(1)) if m else 0
    return (year, 0, 0)

def clean_bollywood_movie_details(df: pd.DataFrame) -> pd.DataFrame:
    """Cleans and normalizes BollywoodMovieDetail.csv."""
    df = df.copy()
    
    # Drop exact duplicates
    df = df.drop_duplicates(subset=["imdbId"])
    
    df["clean_title"] = df["title"].astype(str).str.strip()
    df["norm_title"] = df["clean_title"].apply(normalize_title)
    
    # Parse release date
    parsed_dates = df["releaseDate"].apply(parse_release_date)
    df["parsed_year"] = parsed_dates.apply(lambda x: x[0])
    df["parsed_month"] = parsed_dates.apply(lambda x: x[1])
    
    # Fill release_year from parsed if missing or 0
    df["release_year"] = np.where(df["releaseYear"] > 1900, df["releaseYear"], df["parsed_year"])
    df["release_month"] = df["parsed_month"]
    
    # Clean categorical text
    df["clean_genre"] = df["genre"].fillna("Drama").apply(normalize_text)
    df["clean_actors"] = df["actors"].fillna("").apply(normalize_text)
    df["clean_directors"] = df["directors"].fillna("").apply(normalize_text)
    df["clean_writers"] = df["writers"].fillna("").apply(normalize_text)
    df["is_sequel"] = df["sequel"].fillna(0).astype(int)
    
    # Target cleanup (hitFlop scale 1-9)
    df["raw_hit_flop"] = pd.to_numeric(df["hitFlop"], errors="coerce").fillna(1).astype(int)
    
    logger.info(f"Cleaned BollywoodMovieDetail: {len(df)} rows")
    return df

def clean_rankings(df_actors: pd.DataFrame, df_directors: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Cleans actor and director historical ranking tables."""
    act = df_actors.copy()
    act = act.dropna(subset=["actorName"]).drop_duplicates(subset=["actorName"])
    act["norm_name"] = act["actorName"].apply(normalize_title)
    act["actor_movie_count"] = pd.to_numeric(act["movieCount"], errors="coerce").fillna(0)
    act["actor_rating_sum"] = pd.to_numeric(act["ratingSum"], errors="coerce").fillna(0)
    act["actor_normalized_rating"] = pd.to_numeric(act["normalizedRating"], errors="coerce").fillna(0)
    act["actor_google_hits"] = pd.to_numeric(act["googleHits"], errors="coerce").fillna(0)
    
    direct = df_directors.copy()
    direct = direct.dropna(subset=["directorName"]).drop_duplicates(subset=["directorName"])
    direct["norm_name"] = direct["directorName"].apply(normalize_title)
    direct["director_movie_count"] = pd.to_numeric(direct["movieCount"], errors="coerce").fillna(0)
    direct["director_rating_sum"] = pd.to_numeric(direct["ratingSum"], errors="coerce").fillna(0)
    direct["director_normalized_rating"] = pd.to_numeric(direct["normalizedRating"], errors="coerce").fillna(0)
    direct["director_google_hits"] = pd.to_numeric(direct["googleHits"], errors="coerce").fillna(0)
    
    return act, direct

def clean_financial_datasets(df_fb: pd.DataFrame, df_fh: pd.DataFrame) -> pd.DataFrame:
    """Cleans and standardizes financial box office tables (Final Bollywood & Final Hollywood)."""
    # Fix Bollywood
    fb = df_fb.copy()
    fb.columns = [c.strip() for c in fb.columns]
    fb = fb.rename(columns={
        "Title": "title", "Date": "release_date", "Genre": "genre",
        "orig_lang": "orig_lang", "Revenue($)": "revenue_usd",
        "Budget($)": "budget_usd", "score": "imdb_score", "country": "country"
    })
    
    # Fix Hollywood (header fix)
    fh = df_fh.copy()
    if "Creed III" in fh.columns:
        # Header was read as data row
        header_vals = list(df_fh.columns)
        fh_data = [header_vals] + fh.values.tolist()
        fh = pd.DataFrame(fh_data, columns=[
            "title", "release_date", "genre", "orig_lang",
            "revenue_usd", "budget_usd", "country", "imdb_score"
        ])
    else:
        fh = fh.rename(columns={
            "Title": "title", "Date": "release_date", "Genre": "genre",
            "orig_lang": "orig_lang", "Revenue($)": "revenue_usd",
            "Budget($)": "budget_usd", "score": "imdb_score", "country": "country"
        })
        
    combined = pd.concat([fb, fh], ignore_index=True)
    combined["clean_title"] = combined["title"].astype(str).str.strip()
    combined["norm_title"] = combined["clean_title"].apply(normalize_title)
    
    combined["revenue_usd"] = pd.to_numeric(combined["revenue_usd"], errors="coerce").fillna(0)
    combined["budget_usd"] = pd.to_numeric(combined["budget_usd"], errors="coerce").fillna(0)
    combined["imdb_score"] = pd.to_numeric(combined["imdb_score"], errors="coerce").fillna(0)
    
    parsed = combined["release_date"].apply(parse_release_date)
    combined["release_year"] = parsed.apply(lambda x: x[0])
    combined["release_month"] = parsed.apply(lambda x: x[1])
    
    # Filter out empty or corrupted records
    combined = combined[combined["norm_title"] != ""].copy()
    combined = combined.drop_duplicates(subset=["norm_title", "release_year"])
    
    logger.info(f"Cleaned financial box office dataset: {len(combined)} records ({len(fb)} Bollywood, {len(fh)} Hollywood)")
    return combined

def run_cleaning_pipeline() -> Dict[str, pd.DataFrame]:
    """Runs all dataset cleaning functions and saves interim datasets."""
    root = get_project_root()
    dfs = load_raw_csv_files()
    interim_dir = root / "data" / "interim"
    interim_dir.mkdir(parents=True, exist_ok=True)
    
    bmd_clean = clean_bollywood_movie_details(dfs["bollywood_movies/BollywoodMovieDetail.csv"])
    act_clean, dir_clean = clean_rankings(
        dfs["bollywood_movies/BollywoodActorRanking.csv"],
        dfs["bollywood_movies/BollywoodDirectorRanking.csv"]
    )
    fin_clean = clean_financial_datasets(
        dfs["imdb_ott/Final Bollywood.csv"],
        dfs["imdb_ott/Final Hollywood.csv"]
    )
    
    bmd_clean.to_parquet(interim_dir / "clean_bollywood_movies.parquet", index=False)
    act_clean.to_parquet(interim_dir / "clean_actor_rankings.parquet", index=False)
    dir_clean.to_parquet(interim_dir / "clean_director_rankings.parquet", index=False)
    fin_clean.to_parquet(interim_dir / "clean_financial_movies.parquet", index=False)
    
    logger.info("Interim cleaned files successfully persisted to ML/data/interim/")
    return {
        "bollywood_movies": bmd_clean,
        "actors": act_clean,
        "directors": dir_clean,
        "financial": fin_clean
    }

if __name__ == "__main__":
    run_cleaning_pipeline()
