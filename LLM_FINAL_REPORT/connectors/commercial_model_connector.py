"""
Connector for the existing Commercial Prediction Model (ML/).
Integrates with ML.src.inference.predict.FilmyAIPredictor without modifying original code.
"""
import sys
from pathlib import Path
from typing import Dict, Any, Optional

from LLM_FINAL_REPORT.config import WORKSPACE_ROOT, ML_DIR
from LLM_FINAL_REPORT.schemas.evidence_schema import CommercialEvidence, FactorEvidence

# Ensure workspace root is in sys.path for ML package imports
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))


class CommercialModelConnector:
    """
    Safely connects to and executes predictions using the existing trained ML model.
    """
    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or (ML_DIR / "models")
        self._predictor = None
        self._init_error = None

    def _get_predictor(self):
        if self._predictor is None and self._init_error is None:
            try:
                from ML.src.inference.predict import FilmyAIPredictor
                self._predictor = FilmyAIPredictor(models_dir=self.models_dir)
            except Exception as e:
                self._init_error = str(e)
                print(f"[CommercialModelConnector] Warning: Failed to initialize FilmyAIPredictor: {e}")
        return self._predictor

    def predict(self, payload: Dict[str, Any]) -> CommercialEvidence:
        """
        Executes prediction on the input payload and returns a normalized CommercialEvidence object.
        """
        predictor = self._get_predictor()
        if predictor is None:
            return CommercialEvidence(
                status="failed",
                error_message=f"ML Predictor initialization error: {self._init_error}"
            )

        # Map input payload to expected ML predictor format
        ml_input = {
            "title": payload.get("title") or payload.get("FilmName", "Untitled Film"),
            "genre": payload.get("genre") or payload.get("Genre", "Drama"),
            "actors": payload.get("actors") or payload.get("Casting", []),
            "director": payload.get("director") or payload.get("DirectorName", ""),
            "budget": float(payload.get("budget", 0.0) or 0.0),
            "release_year": int(payload.get("release_year", 2025) or 2025),
            "release_month": int(payload.get("release_month", 6) or 6),
            "is_sequel": int(bool(payload.get("is_sequel", 0))),
            "writers": payload.get("writers", [])
        }

        try:
            raw_result = predictor.predict(ml_input)
            
            factors = [
                FactorEvidence(factor=f.get("factor", ""), impact=f.get("impact", ""))
                for f in raw_result.get("important_factors", [])
            ]

            return CommercialEvidence(
                status="available",
                model_version=raw_result.get("model_version", "1.0.0-filmyai-ml"),
                predicted_commercial_class=raw_result.get("predicted_class", "Average"),
                predicted_class_code=raw_result.get("predicted_class_code", 1),
                commercial_success_probability=raw_result.get("success_probability", 0.5),
                model_confidence=raw_result.get("confidence", 0.5),
                predicted_commercial_score=raw_result.get("predicted_commercial_score", 5.0),
                commercial_score_scale=raw_result.get("commercial_score_scale", "1.0 (Disaster) to 9.0 (Historic Blockbuster)"),
                class_probabilities=raw_result.get("class_probabilities", {}),
                important_contributing_factors=factors,
                box_office_numeric_prediction="not_available",
                imdb_rating_prediction="not_available"
            )
        except Exception as e:
            return CommercialEvidence(
                status="failed",
                error_message=f"Prediction execution failed: {str(e)}"
            )
