import pytest
from ML.src.inference.predict import FilmyAIPredictor

@pytest.fixture(scope="module")
def predictor():
    return FilmyAIPredictor()

def test_inference_valid_payload(predictor):
    payload = {
        "title": "Pathaan 2",
        "genre": "Action, Thriller",
        "actors": ["Shah Rukh Khan", "Deepika Padukone", "John Abraham"],
        "director": "Siddharth Anand",
        "budget": 250000000,
        "release_year": 2026,
        "release_month": 1,
        "is_sequel": 1
    }
    output = predictor.predict(payload)
    
    assert "predicted_class" in output
    assert output["predicted_class"] in ["Flop", "Average", "Hit", "Super Hit"]
    assert 0.0 <= output["success_probability"] <= 1.0
    assert 0.0 <= output["confidence"] <= 1.0
    assert 1.0 <= output["predicted_commercial_score"] <= 9.0
    assert len(output["class_probabilities"]) == 4
    assert pytest.approx(sum(output["class_probabilities"].values()), abs=1e-3) == 1.0

def test_inference_unknown_cast_and_empty_budget(predictor):
    payload = {
        "title": "Indie Art Movie",
        "genre": "Drama",
        "actors": ["Unknown Actor A", "Unknown Actor B"],
        "director": "Unknown Director",
        "budget": 0,
        "release_year": 2025,
        "release_month": 4,
        "is_sequel": 0
    }
    output = predictor.predict(payload)
    
    assert output["predicted_class"] in ["Flop", "Average", "Hit", "Super Hit"]
    assert 1.0 <= output["predicted_commercial_score"] <= 9.0
    assert len(output["important_factors"]) > 0
