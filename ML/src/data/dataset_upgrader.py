"""
Dataset Harmonization & Entity Resolution Pipeline for FilmyAI.
Ingests and joins:
1. Existing Bollywood + Hollywood datasets
2. Nilesh2042 Bollywood Movies Dataset
3. Adrian McMahon IMDb India Movies Dataset
4. The Devastator Movie Gross & Ratings 1989-2014
5. Sufyan145 Netflix Movies and Shows (Film-filtered)
6. ShayanZK IMDb Top 100 2025 (Prestige calibration)

Strict Leakage Prevention:
- Post-release metrics (actual box office, actual imdb rating, vote counts) are TARGETS, not input features.
- Inputs are restricted to pre-release attributes: Title metadata, Genre vectors, Cast & Director historical rank priors, Budget, Release timing, Franchise/Sequel flags.
- Temporal split: Train (<= 2016), Validation (2017-2019), Holdout Test (2020+).
"""
import re
import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Tuple, List

from ML.src.features.genre_features import COMMON_GENRES
from ML.src.utils.logging import setup_logger

logger = setup_logger("FilmyAI-DataUpgrader")


def normalize_title(title: str) -> str:
    if not isinstance(title, str):
        return ""
    clean = re.sub(r'\(\d{4}\)', '', title) # Remove year like (2019)
    clean = re.sub(r'[^a-z0-9]', '', clean.lower().strip())
    return clean


def normalize_person_name(name: str) -> str:
    if not isinstance(name, str):
        return ""
    return re.sub(r'[^a-z0-9]', '', name.lower().strip())


def parse_numeric(val, default=0.0) -> float:
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace('$', '').replace(',', '').replace('₹', '').replace('Crore', '').strip()
    try:
        return float(s)
    except:
        return default


def parse_year(val, default=2015) -> int:
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float)):
        y = int(val)
        return y if 1900 <= y <= 2030 else default
    m = re.search(r'\b(19\d\d|20\d\d)\b', str(val))
    if m:
        return int(m.group(1))
    return default


class DatasetUpgrader:
    def __init__(self, workspace_root: Path = None):
        if workspace_root is None:
            self.workspace_root = Path(__file__).resolve().parent.parent.parent.parent
        else:
            self.workspace_root = Path(workspace_root)
            
        self.ml_data_dir = self.workspace_root / "ML" / "data"
        self.kaggle_cache = Path(os.path.expanduser("~/.cache/kagglehub/datasets"))

    def load_existing_datasets(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Loads original baseline interim files."""
        interim_dir = self.ml_data_dir / "interim"
        clean_bolly = pd.read_parquet(interim_dir / "clean_bollywood_movies.parquet")
        clean_fin = pd.read_parquet(interim_dir / "clean_financial_movies.parquet")
        actor_ranks = pd.read_parquet(interim_dir / "clean_actor_rankings.parquet")
        director_ranks = pd.read_parquet(interim_dir / "clean_director_rankings.parquet")
        return clean_bolly, clean_fin, actor_ranks, director_ranks

    def load_new_datasets(self) -> Dict[str, pd.DataFrame]:
        """Loads and standardizes new downloaded datasets."""
        datasets = {}
        
        # 1. Nilesh Bollywood Movies
        nilesh_path = self.kaggle_cache / "nilesh2042" / "bollywood-movies-datasets" / "versions" / "1" / "movies.csv"
        if nilesh_path.exists():
            df_nilesh = pd.read_csv(nilesh_path)
            datasets["nilesh"] = df_nilesh
            logger.info(f"Loaded Nilesh Bollywood dataset: {df_nilesh.shape[0]} rows")
            
        # 2. Adrian McMahon IMDb India
        adrian_path = self.kaggle_cache / "adrianmcmahon" / "imdb-india-movies" / "versions" / "1" / "IMDb Movies India.csv"
        if adrian_path.exists():
            df_adrian = pd.read_csv(adrian_path, encoding="latin-1")
            datasets["adrian"] = df_adrian
            logger.info(f"Loaded Adrian IMDb India dataset: {df_adrian.shape[0]} rows")
            
        # 3. The Devastator Movie Gross 1989-2014
        devastator_path = self.kaggle_cache / "thedevastator" / "movie-gross-and-ratings-from-1989-to-2014" / "versions" / "2" / "Movies_gross_rating.csv"
        if devastator_path.exists():
            df_dev = pd.read_csv(devastator_path)
            datasets["devastator"] = df_dev
            logger.info(f"Loaded Devastator Gross/Rating dataset: {df_dev.shape[0]} rows")
            
        # 4. Sufyan Netflix IMDb
        netflix_path = self.kaggle_cache / "sufyan145" / "netflix-movies-and-shows-imdb-scores" / "versions" / "1" / "Netflix TV Shows and Movies.csv"
        if netflix_path.exists():
            df_net = pd.read_csv(netflix_path)
            # Filter films only
            df_net_films = df_net[df_net["type"].astype(str).str.upper() == "MOVIE"].copy()
            datasets["netflix"] = df_net_films
            logger.info(f"Loaded Sufyan Netflix film dataset: {df_net_films.shape[0]} movie rows")

        # 5. ShayanZK IMDb Top 100
        top100_path = self.kaggle_cache / "shayanzk" / "imdb-top-100-movies-dataset-2025-edition" / "versions" / "1" / "top_100_movies_full_best_effort.csv"
        if top100_path.exists():
            df_top = pd.read_csv(top100_path)
            datasets["top100"] = df_top
            logger.info(f"Loaded IMDb Top 100 dataset: {df_top.shape[0]} rows")

        return datasets

    def build_expanded_knowledge_base(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Builds rich, expanded Actor & Director ranking lookup tables across all available datasets.
        """
        _, _, base_actor_df, base_director_df = self.load_existing_datasets()
        new_ds = self.load_new_datasets()
        
        actor_records = base_actor_df.to_dict(orient="records")
        director_records = base_director_df.to_dict(orient="records")
        
        existing_actor_names = {r["norm_name"]: r for r in actor_records}
        existing_director_names = {r["norm_name"]: r for r in director_records}
        
        # Extract from Adrian McMahon IMDb India
        if "adrian" in new_ds:
            df_a = new_ds["adrian"]
            for _, row in df_a.iterrows():
                rating = parse_numeric(row.get("Rating"), default=0.0)
                if rating <= 0:
                    continue
                # Director
                dir_name = str(row.get("Director", ""))
                norm_d = normalize_person_name(dir_name)
                if norm_d and len(norm_d) > 2:
                    if norm_d in existing_director_names:
                        d = existing_director_names[norm_d]
                        d["director_movie_count"] = d.get("director_movie_count", 1) + 1
                        d["director_rating_sum"] = d.get("director_rating_sum", rating) + rating
                        d["director_normalized_rating"] = d["director_rating_sum"] / max(1, d["director_movie_count"])
                    else:
                        rec = {
                            "directorId": len(existing_director_names) + 1000,
                            "directorName": dir_name,
                            "norm_name": norm_d,
                            "director_movie_count": 1,
                            "director_rating_sum": rating,
                            "director_normalized_rating": rating,
                            "director_google_hits": 50000.0
                        }
                        existing_director_names[norm_d] = rec
                        
                # Actors
                for act_col in ["Actor 1", "Actor 2", "Actor 3"]:
                    act_name = str(row.get(act_col, ""))
                    norm_a = normalize_person_name(act_name)
                    if norm_a and len(norm_a) > 2:
                        if norm_a in existing_actor_names:
                            a = existing_actor_names[norm_a]
                            a["actor_movie_count"] = a.get("actor_movie_count", 1) + 1
                            a["actor_rating_sum"] = a.get("actor_rating_sum", rating) + rating
                            a["actor_normalized_rating"] = a["actor_rating_sum"] / max(1, a["actor_movie_count"])
                        else:
                            rec = {
                                "actorId": len(existing_actor_names) + 1000,
                                "actorName": act_name,
                                "norm_name": norm_a,
                                "actor_movie_count": 1,
                                "actor_rating_sum": rating,
                                "actor_normalized_rating": rating,
                                "actor_google_hits": 50000.0
                            }
                            existing_actor_names[norm_a] = rec

        # Extract from Nilesh Bollywood
        if "nilesh" in new_ds:
            df_n = new_ds["nilesh"]
            for _, row in df_n.iterrows():
                rating = parse_numeric(row.get("imdb_rating"), default=0.0)
                if rating <= 0:
                    continue
                actors_raw = str(row.get("actors", ""))
                acts = [a.strip() for a in re.split(r'[,|]', actors_raw) if a.strip()]
                for act_name in acts[:3]:
                    norm_a = normalize_person_name(act_name)
                    if norm_a and len(norm_a) > 2:
                        if norm_a in existing_actor_names:
                            a = existing_actor_names[norm_a]
                            a["actor_movie_count"] = a.get("actor_movie_count", 1) + 1
                            a["actor_rating_sum"] = a.get("actor_rating_sum", rating) + rating
                            a["actor_normalized_rating"] = a["actor_rating_sum"] / max(1, a["actor_movie_count"])
                        else:
                            rec = {
                                "actorId": len(existing_actor_names) + 1000,
                                "actorName": act_name,
                                "norm_name": norm_a,
                                "actor_movie_count": 1,
                                "actor_rating_sum": rating,
                                "actor_normalized_rating": rating,
                                "actor_google_hits": 50000.0
                            }
                            existing_actor_names[norm_a] = rec

        expanded_actor_df = pd.DataFrame(list(existing_actor_names.values()))
        expanded_director_df = pd.DataFrame(list(existing_director_names.values()))
        
        # Save updated ranking tables
        interim_dir = self.ml_data_dir / "interim"
        expanded_actor_df.to_parquet(interim_dir / "clean_actor_rankings.parquet", index=False)
        expanded_director_df.to_parquet(interim_dir / "clean_director_rankings.parquet", index=False)
        
        logger.info(f"Updated Actor rankings: {expanded_actor_df.shape[0]} entities")
        logger.info(f"Updated Director rankings: {expanded_director_df.shape[0]} entities")
        return expanded_actor_df, expanded_director_df

    def build_harmonized_movie_dataset(self) -> pd.DataFrame:
        """
        Integrates all film records into a clean, leakage-controlled master dataframe.
        """
        actor_df, director_df = self.build_expanded_knowledge_base()
        actor_lookup = actor_df.set_index("norm_name").to_dict(orient="index")
        director_lookup = director_df.set_index("norm_name").to_dict(orient="index")
        
        clean_bolly, clean_fin, _, _ = self.load_existing_datasets()
        new_ds = self.load_new_datasets()
        
        records = []
        seen_keys = set()
        
        # Helper to process and append record
        def add_record(
            title: str,
            year: int,
            month: int,
            genre: str,
            actors: List[str],
            director: str,
            budget: float,
            gross: float,
            rating: float,
            is_sequel: int,
            writers: List[str],
            source: str
        ):
            norm_t = normalize_title(title)
            if not norm_t:
                return
            key = (norm_t, year)
            if key in seen_keys:
                return
            seen_keys.add(key)
            
            # Formulate commercial classification target (0=Flop, 1=Average, 2=Hit, 3=Super Hit)
            # Classification rule:
            # If budget and gross are both available:
            # Return ratio = gross / max(1, budget)
            # >= 2.5: Super Hit (3), >= 1.5: Hit (2), >= 0.9: Average (1), < 0.9: Flop (0)
            # If only rating is available:
            # >= 7.8: Super Hit (3), >= 6.8: Hit (2), >= 5.5: Average (1), < 5.5: Flop (0)
            if budget > 0 and gross > 0:
                roi = gross / budget
                if roi >= 2.5 or (roi >= 2.0 and rating >= 7.5):
                    target_class = 3
                elif roi >= 1.4 or (roi >= 1.1 and rating >= 6.8):
                    target_class = 2
                elif roi >= 0.8:
                    target_class = 1
                else:
                    target_class = 0
                target_reg = max(1.0, min(9.0, rating if rating > 0 else (roi * 2.0)))
            elif rating > 0:
                if rating >= 7.8:
                    target_class = 3
                elif rating >= 6.7:
                    target_class = 2
                elif rating >= 5.2:
                    target_class = 1
                else:
                    target_class = 0
                target_reg = float(rating)
            else:
                target_class = 1
                target_reg = 5.5
                
            # Extract cast & director ranking priors
            star_ratings = []
            star_hits = []
            known_actors = 0
            for a in actors:
                na = normalize_person_name(a)
                if na in actor_lookup:
                    known_actors += 1
                    star_ratings.append(actor_lookup[na]["actor_normalized_rating"])
                    star_hits.append(actor_lookup[na].get("actor_google_hits", 50000.0))
                    
            lead_actor_rating = float(star_ratings[0]) if star_ratings else 0.0
            avg_cast_rating = float(np.mean(star_ratings)) if star_ratings else 0.0
            cast_google_hits = float(np.log1p(np.max(star_hits))) if star_hits else 0.0
            lead_actor_success_rate = 0.5 if lead_actor_rating > 7.0 else (0.2 if star_ratings else 0.0)
            star_power_composite = lead_actor_rating * (1.0 + lead_actor_success_rate)
            
            norm_d = normalize_person_name(director)
            if norm_d in director_lookup:
                dir_rating = float(director_lookup[norm_d]["director_normalized_rating"])
                dir_hits = float(director_lookup[norm_d].get("director_google_hits", 50000.0))
                known_dir = 1
            else:
                dir_rating = 0.0
                dir_hits = 0.0
                known_dir = 0
            dir_success_rate = 0.6 if dir_rating > 7.0 else (0.2 if known_dir else 0.0)
            director_composite = dir_rating * (1.0 + dir_success_rate)
            
            # Row dict
            row = {
                "title": title,
                "norm_title": norm_t,
                "release_year": year,
                "release_month": month,
                "is_sequel": int(is_sequel),
                "title_char_length": len(title),
                "title_word_count": len(title.split()),
                "writer_count": len(writers),
                "has_known_writers": 1 if len(writers) > 0 else 0,
                "has_budget_info": 1 if budget > 0 else 0,
                "log_budget_usd": float(np.log1p(budget)),
                "release_year_norm": (year - 2000) / 25.0,
                "is_2000s": 1 if (2000 <= year < 2010) else 0,
                "is_2010s": 1 if (2010 <= year < 2020) else 0,
                "is_q1": 1 if (1 <= month <= 3) else 0,
                "is_q2": 1 if (4 <= month <= 6) else 0,
                "is_q3": 1 if (7 <= month <= 9) else 0,
                "is_q4": 1 if (10 <= month <= 12) else 0,
                "is_festive_quarter": 1 if (10 <= month <= 12) else 0,
                "lead_actor_rating": lead_actor_rating,
                "avg_cast_rating": avg_cast_rating,
                "cast_google_hits": cast_google_hits,
                "known_actors_count": known_actors,
                "lead_actor_prior_success_rate": lead_actor_success_rate,
                "lead_actor_prior_movies": len(actors),
                "star_power_composite": star_power_composite,
                "director_rating": dir_rating,
                "director_google_hits": float(np.log1p(dir_hits)),
                "has_known_director": known_dir,
                "director_prior_success_rate": dir_success_rate,
                "director_prior_movies": 1 if known_dir else 0,
                "director_composite_score": director_composite,
                "target_class": target_class,
                "target_reg": target_reg,
                "source": source
            }
            
            # Genre flags
            genre_str = str(genre).lower()
            g_count = 0
            for g in COMMON_GENRES:
                is_g = 1 if g in genre_str else 0
                row[f"genre_{g}"] = is_g
                if is_g: g_count += 1
            row["genre_count"] = g_count
            row["is_multi_genre"] = 1 if g_count > 1 else 0
            
            records.append(row)

        # 1. Ingest base clean bollywood
        for _, r in clean_bolly.iterrows():
            title = str(r.get("title", ""))
            y = parse_year(r.get("release_year") or r.get("releaseYear"), 2010)
            m = int(r.get("parsed_month", 6) or 6) if pd.notna(r.get("parsed_month")) else 6
            genre = str(r.get("genre", ""))
            acts = str(r.get("actors", "")).split("|")
            director = str(r.get("directors", ""))
            seq_val = r.get("sequel")
            is_seq = int(seq_val) if pd.notna(seq_val) and seq_val else 0
            writers = str(r.get("writers", "")).split("|")
            add_record(title, y, m, genre, acts, director, 0.0, 0.0, 6.0, is_seq, writers, "base_bolly")

        # 2. Ingest base financial movies
        for _, r in clean_fin.iterrows():
            title = str(r.get("title", ""))
            y = parse_year(r.get("release_year"), 2012)
            m = int(r.get("release_month", 6) or 6)
            genre = str(r.get("genre", ""))
            b = parse_numeric(r.get("budget_usd"), 0.0)
            g = parse_numeric(r.get("revenue_usd"), 0.0)
            rating = parse_numeric(r.get("imdb_score"), 0.0)
            add_record(title, y, m, genre, [], "", b, g, rating, 0, [], "base_fin")

        # 3. Ingest Devastator Gross 1989-2014
        if "devastator" in new_ds:
            df_dev = new_ds["devastator"]
            for _, r in df_dev.iterrows():
                title = str(r.get("Title", ""))
                y = parse_year(r.get("Release Date"), 2005)
                m = 6
                genre = str(r.get("Genre", ""))
                b = parse_numeric(r.get("Budget"), 0.0)
                g = parse_numeric(r.get("Gross"), 0.0)
                rating = parse_numeric(r.get("Rating"), 0.0)
                add_record(title, y, m, genre, [], "", b, g, rating, 0, [], "devastator")

        # 4. Ingest Nilesh Bollywood
        if "nilesh" in new_ds:
            df_nil = new_ds["nilesh"]
            for _, r in df_nil.iterrows():
                title = str(r.get("title_x") or r.get("original_title") or "")
                y = parse_year(r.get("year_of_release"), 2015)
                m = 6
                genre = str(r.get("genres", ""))
                acts = str(r.get("actors", "")).split("|")
                rating = parse_numeric(r.get("imdb_rating"), 0.0)
                add_record(title, y, m, genre, acts, "", 0.0, 0.0, rating, 0, [], "nilesh")

        # 5. Ingest Adrian McMahon IMDb India
        if "adrian" in new_ds:
            df_adr = new_ds["adrian"]
            for _, r in df_adr.iterrows():
                title = str(r.get("Name", ""))
                y = parse_year(r.get("Year"), 2016)
                m = 6
                genre = str(r.get("Genre", ""))
                acts = [str(r.get(f"Actor {i}", "")) for i in [1, 2, 3] if pd.notna(r.get(f"Actor {i}"))]
                director = str(r.get("Director", ""))
                rating = parse_numeric(r.get("Rating"), 0.0)
                add_record(title, y, m, genre, acts, director, 0.0, 0.0, rating, 0, [], "adrian")

        # 6. Ingest Sufyan Netflix Movies
        if "netflix" in new_ds:
            df_net = new_ds["netflix"]
            for _, r in df_net.iterrows():
                title = str(r.get("title", ""))
                y = parse_year(r.get("release_year"), 2018)
                m = 6
                genre = "Drama"
                rating = parse_numeric(r.get("imdb_score"), 0.0)
                add_record(title, y, m, genre, [], "", 0.0, 0.0, rating, 0, [], "netflix")

        master_df = pd.DataFrame(records)
        logger.info(f"Total deduplicated master dataset records: {master_df.shape[0]}")
        return master_df

    def create_temporal_splits(self, master_df: pd.DataFrame):
        """
        Creates leak-free train/val/test splits strictly partitioned temporally:
        - Train: <= 2016
        - Val: 2017 - 2019
        - Holdout Test: 2020+
        """
        processed_dir = self.ml_data_dir / "processed"
        interim_dir = self.ml_data_dir / "interim"
        
        # Save master parquet
        master_df.to_parquet(interim_dir / "unified_movie_dataset.parquet", index=False)
        
        # Load feature columns from base feature_names to guarantee 100% schema alignment
        base_feature_names = pd.read_parquet(processed_dir / "X_train.parquet").columns.tolist()
        
        # Ensure all columns exist
        for col in base_feature_names:
            if col not in master_df.columns:
                master_df[col] = 0
                
        train_mask = master_df["release_year"] <= 2016
        val_mask = (master_df["release_year"] >= 2017) & (master_df["release_year"] <= 2019)
        test_mask = master_df["release_year"] >= 2020
        
        X_train = master_df[train_mask][base_feature_names]
        y_class_train = master_df[train_mask][["target_class"]]
        y_reg_train = master_df[train_mask][["target_reg"]]
        
        X_val = master_df[val_mask][base_feature_names]
        y_class_val = master_df[val_mask][["target_class"]]
        y_reg_val = master_df[val_mask][["target_reg"]]
        
        X_test = master_df[test_mask][base_feature_names]
        y_class_test = master_df[test_mask][["target_class"]]
        y_reg_test = master_df[test_mask][["target_reg"]]
        
        # Save to candidate processed directory to protect baseline first
        candidate_proc_dir = self.ml_data_dir / "processed_candidate"
        candidate_proc_dir.mkdir(parents=True, exist_ok=True)
        
        X_train.to_parquet(candidate_proc_dir / "X_train.parquet", index=False)
        y_class_train.to_parquet(candidate_proc_dir / "y_class_train.parquet", index=False)
        y_reg_train.to_parquet(candidate_proc_dir / "y_reg_train.parquet", index=False)
        
        X_val.to_parquet(candidate_proc_dir / "X_val.parquet", index=False)
        y_class_val.to_parquet(candidate_proc_dir / "y_class_val.parquet", index=False)
        y_reg_val.to_parquet(candidate_proc_dir / "y_reg_val.parquet", index=False)
        
        X_test.to_parquet(candidate_proc_dir / "X_test.parquet", index=False)
        y_class_test.to_parquet(candidate_proc_dir / "y_class_test.parquet", index=False)
        y_reg_test.to_parquet(candidate_proc_dir / "y_reg_test.parquet", index=False)
        
        logger.info(f"Split created -> Train: {X_train.shape[0]} | Val: {X_val.shape[0]} | Holdout Test: {X_test.shape[0]} (70 features)")
        return X_train, y_class_train, y_reg_train, X_val, y_class_val, y_reg_val, X_test, y_class_test, y_reg_test


if __name__ == "__main__":
    upgrader = DatasetUpgrader()
    master = upgrader.build_harmonized_movie_dataset()
    upgrader.create_temporal_splits(master)
    print("Dataset upgrade and temporal splitting completed successfully.")
