"""
Unit tests for Commercial Model and Video Engine Connectors.
"""
import pytest
from LLM_FINAL_REPORT.connectors.commercial_model_connector import CommercialModelConnector
from LLM_FINAL_REPORT.connectors.video_engine_connector import VideoEngineConnector


def test_commercial_model_connector_prediction():
    """Verify that CommercialModelConnector properly loads existing ML models and predicts."""
    connector = CommercialModelConnector()
    sample_payload = {
        "title": "Stree 2",
        "genre": "Horror, Comedy",
        "actors": ["Shraddha Kapoor", "Rajkummar Rao", "Pankaj Tripathi"],
        "director": "Amar Kaushik",
        "budget": 60000000,
        "release_year": 2024,
        "release_month": 8,
        "is_sequel": 1
    }

    result = connector.predict(sample_payload)
    
    assert result.status == "available"
    assert result.predicted_commercial_class in ["Flop", "Average", "Hit", "Super Hit"]
    assert 0.0 <= result.commercial_success_probability <= 1.0
    assert 1.0 <= result.predicted_commercial_score <= 9.0
    assert result.box_office_numeric_prediction == "not_available"
    assert result.imdb_rating_prediction == "not_available"
    assert len(result.important_contributing_factors) > 0


def test_video_engine_connector_graceful_handling():
    """Verify VideoEngineConnector handles missing video gracefully."""
    connector = VideoEngineConnector()
    result = connector.analyze(video_path="non_existent_file.mp4")
    
    assert result.status == "not_available"
    assert "could not be located" in result.error_message
