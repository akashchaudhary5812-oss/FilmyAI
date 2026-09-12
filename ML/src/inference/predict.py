import re
import json
import argparse
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Union

from ML.src.utils.logging import setup_logger
from ML.src.utils.config import get_project_root
from ML.src.utils.helpers import load_artifact
from ML.src.features.genre_features import COMMON_GENRES

logger = setup_logger("FilmyAI-Inference")

CLASS_NAMES = ["Flop", "Average", "Hit", "Super Hit"]

class FilmyAIPredictor:
    """Production Inference Engine for FilmyAI Commercial Success & Rating Estimation."""
    
    def __init__(self, models_dir: Union[str, Path] = None):
        if models_dir is None:
            models_dir = get_project_root() / "models"
        else:
            models_dir = Path(models_dir)
            
        self.models_dir = models_dir
        self.preprocessor = load_artifact(models_dir / "preprocessors" / "feature_scaler.joblib")
        self.feature_names = load_artifact(models_dir / "preprocessors" / "feature_names.joblib")
        self.clf_model = load_artifact(models_dir / "classification" / "champion_classifier.joblib")
        self.reg_model = load_artifact(models_dir / "regression" / "champion_regressor.joblib")
        
        # Load Actor and Director Lookups from interim parquet
        root = get_project_root()
        interim_dir = root / "data" / "interim"
        self.actor_df = pd.read_parquet(interim_dir / "clean_actor_rankings.parquet")
        self.director_df = pd.read_parquet(interim_dir / "clean_director_rankings.parquet")
        
        self.actor_lookup = self.actor_df.set_index("norm_name")[["actor_movie_count", "actor_normalized_rating", "actor_google_hits"]].to_dict(orient="index")
        self.director_lookup = self.director_df.set_index("norm_name")[["director_movie_count", "director_normalized_rating", "director_google_hits"]].to_dict(orient="index")
        
        logger.info(f"FilmyAIPredictor successfully loaded with {len(self.feature_names)} features.")

    @staticmethod
    def _normalize_name(name: str) -> str:
        if not isinstance(name, str):
            return ""
        return re.sub(r'[^a-z0-9]', '', name.lower().strip())

    def _extract_inference_features(self, payload: Dict[str, Any]) -> pd.DataFrame:
        """Extracts and maps raw user/backend input dictionary into exact model feature vector."""
        title = str(payload.get("title", ""))
        genre_str = str(payload.get("genre", "Drama")).lower()
        actors = payload.get("actors", [])
        if isinstance(actors, str):
            actors = [a.strip() for a in re.split(r'[,|]', actors) if a.strip()]
        director = str(payload.get("director", ""))
        budget = float(payload.get("budget", 0.0) or 0.0)
        release_year = int(payload.get("release_year", 2024) or 2024)
        release_month = int(payload.get("release_month", 6) or 6)
        is_sequel = int(bool(payload.get("is_sequel", 0)))
        writers = payload.get("writers", [])
        if isinstance(writers, str):
            writers = [w.strip() for w in re.split(r'[,|]', writers) if w.strip()]
            
        row = {}
        
        # Movie metadata features
        row["is_sequel"] = is_sequel
        row["title_char_length"] = len(title)
        row["title_word_count"] = len(title.split())
        row["writer_count"] = len(writers)
        row["has_known_writers"] = 1 if len(writers) > 0 else 0
        row["has_budget_info"] = 1 if budget > 0 else 0
        row["log_budget_usd"] = float(np.log1p(budget))
        
        # Temporal features
        row["release_year_norm"] = (release_year - 2000) / 25.0
        row["is_2000s"] = 1 if (2000 <= release_year < 2010) else 0
        row["is_2010s"] = 1 if (2010 <= release_year < 2020) else 0
        row["release_month"] = release_month
        row["is_q1"] = 1 if (1 <= release_month <= 3) else 0
        row["is_q2"] = 1 if (4 <= release_month <= 6) else 0
        row["is_q3"] = 1 if (7 <= release_month <= 9) else 0
        row["is_q4"] = 1 if (10 <= release_month <= 12) else 0
        row["is_festive_quarter"] = row["is_q4"]
        
        # Genre features
        for g in COMMON_GENRES:
            row[f"genre_{g}"] = 1 if g in genre_str else 0
        row["genre_count"] = sum([row[f"genre_{g}"] for g in COMMON_GENRES])
        row["is_multi_genre"] = 1 if row["genre_count"] > 1 else 0
        
        # Cast features
        star_ratings = []
        google_hits = []
        known_count = 0
        for a in actors:
            norm_a = self._normalize_name(a)
            if norm_a in self.actor_lookup:
                known_count += 1
                star_ratings.append(self.actor_lookup[norm_a]["actor_normalized_rating"])
                google_hits.append(self.actor_lookup[norm_a]["actor_google_hits"])
                
        row["lead_actor_rating"] = float(star_ratings[0]) if star_ratings else 0.0
        row["avg_cast_rating"] = float(np.mean(star_ratings)) if star_ratings else 0.0
        row["cast_google_hits"] = float(np.log1p(np.max(google_hits))) if google_hits else 0.0
        row["known_actors_count"] = known_count
        row["lead_actor_prior_success_rate"] = 0.5 if (star_ratings and star_ratings[0] > 7.0) else (0.2 if star_ratings else 0.0)
        row["lead_actor_prior_movies"] = len(actors)
        row["star_power_composite"] = row["lead_actor_rating"] * (1.0 + row["lead_actor_prior_success_rate"])
        
        # Director features
        norm_dir = self._normalize_name(director)
        if norm_dir in self.director_lookup:
            dir_rating = float(self.director_lookup[norm_dir]["director_normalized_rating"])
            dir_hits = float(self.director_lookup[norm_dir]["director_google_hits"])
            known_dir = 1
        else:
            dir_rating = 0.0
            dir_hits = 0.0
            known_dir = 0
            
        row["director_rating"] = dir_rating
        row["director_google_hits"] = float(np.log1p(dir_hits))
        row["has_known_director"] = known_dir
        row["director_prior_success_rate"] = 0.6 if dir_rating > 7.0 else (0.2 if known_dir else 0.0)
        row["director_prior_movies"] = 1 if known_dir else 0
        row["director_composite_score"] = dir_rating * (1.0 + row["director_prior_success_rate"])
        
        # Create DataFrame aligned with self.feature_names
        df_feat = pd.DataFrame([row])
        for col in self.feature_names:
            if col not in df_feat.columns:
                df_feat[col] = 0
        df_feat = df_feat[self.feature_names]
        return df_feat

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Executes full inference and produces FilmyAI-compliant prediction output."""
        X_raw = self._extract_inference_features(payload)
        
        # Model predictions
        class_idx = int(self.clf_model.predict(X_raw)[0])
        class_name = CLASS_NAMES[min(class_idx, len(CLASS_NAMES) - 1)]
        
        if hasattr(self.clf_model, "predict_proba"):
            probas = self.clf_model.predict_proba(X_raw)[0]
            prob_dict = {CLASS_NAMES[i]: float(probas[i]) for i in range(min(len(probas), len(CLASS_NAMES)))}
            success_prob = float(sum([probas[i] for i in range(len(probas)) if i >= 2])) # Hit or Super Hit
            confidence = float(np.max(probas))
        else:
            prob_dict = {name: (1.0 if name == class_name else 0.0) for name in CLASS_NAMES}
            success_prob = 1.0 if class_idx >= 2 else 0.0
            confidence = 0.75
            
        commercial_score = float(self.reg_model.predict(X_raw)[0])
        commercial_score = max(1.0, min(9.0, commercial_score)) # Clamp between 1.0 and 9.0
        
        # Determine top contributing factors
        factors = []
        if X_raw["lead_actor_rating"].iloc[0] > 6.0:
            factors.append({
                "factor": "Lead Actor Star Power",
                "impact": f"High positive impact from lead star power (rating: {X_raw['lead_actor_rating'].iloc[0]:.1f}/10)"
            })
        if X_raw["director_rating"].iloc[0] > 6.0:
            factors.append({
                "factor": "Director Historical Track Record",
                "impact": f"Strong positive driver from director credibility (rating: {X_raw['director_rating'].iloc[0]:.1f}/10)"
            })
        if X_raw["is_sequel"].iloc[0] == 1:
            factors.append({
                "factor": "Established Franchise / Sequel",
                "impact": "Pre-existing brand recognition provides stronger commercial floor"
            })
        if X_raw["is_q4"].iloc[0] == 1:
            factors.append({
                "factor": "Festive / Holiday Release Window",
                "impact": "Q4 release window historically boosts footfall"
            })
        if not factors:
            factors.append({
                "factor": "Standard Release Profile",
                "impact": "No extraordinary star-power or franchise multipliers detected"
            })
            
        return {
            "title": payload.get("title", "Untitled Film"),
            "predicted_class": class_name,
            "predicted_class_code": class_idx,
            "success_probability": round(success_prob, 4),
            "confidence": round(confidence, 4),
            "predicted_commercial_score": round(commercial_score, 2),
            "commercial_score_scale": "1.0 (Disaster) to 9.0 (Historic Blockbuster)",
            "class_probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
            "important_factors": factors,
            "model_version": "1.0.0-filmyai-ml"
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FilmyAI ML Model Predictor")
    parser.add_argument("--sample", action="store_true", help="Run with a sample movie payload")
    args = parser.parse_args()
    
    predictor = FilmyAIPredictor()
    sample_movie = {
        "title": "Dangal 2",
        "genre": "Biography, Drama, Sport",
        "actors": ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
        "director": "Nitesh Tiwari",
        "budget": 70000000,
        "release_year": 2026,
        "release_month": 12,
        "is_sequel": 1
    }
    
    print("\n--- INFERENCE INPUT ---")
    print(json.dumps(sample_movie, indent=2))
    
    output = predictor.predict(sample_movie)
    print("\n--- FILMY AI PREDICTION OUTPUT ---")
    print(json.dumps(output, indent=2))
