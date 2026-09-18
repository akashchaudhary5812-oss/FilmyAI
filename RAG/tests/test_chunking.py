"""
Unit tests for RAG ReportChunker.
Verifies extraction of all sections, metadata, metrics, timestamps, and recommendations.
"""
import pytest
from RAG.chunking import ReportChunker


SAMPLE_REPORT_DICT = {
    "report_id": "rep_test_001",
    "generated_at_utc": "2026-09-18T10:00:00Z",
    "film_title": "Shadows of Neon",
    "metadata_summary": {
        "director": "Christopher Nolan",
        "casting": ["Cillian Murphy", "Florence Pugh"],
        "genre": "Sci-Fi / Thriller",
        "budget": 100000000.0
    },
    "story_provenance": {
        "script": "USER_PROVIDED",
        "summary": "AI_GENERATED"
    },
    "executive_summary": {
        "film_title": "Shadows of Neon",
        "logline": "A neon-soaked detective unravels temporal anomalies.",
        "commercial_verdict": "High Commercial Potential",
        "overall_film_rating": 8.9,
        "commercial_tier": "Major Studio Tier",
        "key_thesis": "Exceptional visual storytelling and strong genre appeal."
    },
    "cinematography_analysis": {
        "visual_style_overview": "Neo-noir high contrast lighting with anamorphic lenses.",
        "shot_composition_assessment": "Symmetrical central framing in dialogue sequences.",
        "lighting_and_atmosphere": "Chiaroscuro with saturated neon cyan and amber palette.",
        "pacing_and_editing_rhythm": "Rapid 2.4s shot duration in suspense scenes.",
        "soundscape_and_speech": "Low-frequency atmospheric hum with crisp dialogue dynamics."
    },
    "commercial_analysis": {
        "box_office_outlook": "Predicted global theatrical gross of $350M - $450M.",
        "primary_commercial_drivers": ["A-list cast", "High franchise potential"],
        "key_risk_factors": ["High production budget", "Complex non-linear narrative"],
        "target_demographics": ["Ages 18-35", "Sci-Fi enthusiasts"],
        "franchise_and_ancillary_potential": "Strong sequel and video game adaptation potential."
    },
    "creative_technical_assessment": {
        "key_strengths": ["Visual world-building", "Atmospheric sound design"],
        "key_weaknesses": ["Second act pacing lag", "Dense exposition"],
        "thematic_and_narrative_cohesion": "Strong philosophical subtext on memory and reality."
    },
    "strategic_recommendations": {
        "post_production_guidance": ["Tighten 12 minutes in Act 2", "Enhance dialogue clarity in scene 4"],
        "marketing_and_positioning": ["Lead with IMAX exclusive preview teaser"],
        "theatrical_vs_streaming_recommendation": "Wide theatrical release on minimum 3,500 screens."
    },
    "key_scene_highlights": [
        {
            "timestamp_range": "00:04:12 - 00:06:45",
            "shot_type": "Extreme Close-Up",
            "visual_significance": "Deep focus mirror reflection.",
            "narrative_impact": "Reveals character identity duality."
        }
    ],
    "raw_ml_predictions": {
        "predicted_commercial_class": "Super Hit",
        "predicted_commercial_score": 8.4,
        "commercial_success_probability": 0.88,
        "model_confidence": 0.92,
        "important_contributing_factors": [
            {"factor": "Director Track Record", "impact": "+1.8"},
            {"factor": "Budget Scale", "impact": "+1.2"}
        ]
    }
}


def test_chunking_preserves_film_metadata():
    chunks = ReportChunker.chunk_report(
        film_id="film_abc_123",
        report_id="rep_test_001",
        report_data=SAMPLE_REPORT_DICT
    )
    assert len(chunks) > 0
    for chunk in chunks:
        assert chunk.film_id == "film_abc_123"
        assert chunk.film_name == "Shadows of Neon"
        assert chunk.report_id == "rep_test_001"
        assert chunk.content.strip() != ""


def test_chunking_covers_all_sections():
    chunks = ReportChunker.chunk_report(
        film_id="film_abc_123",
        report_id="rep_test_001",
        report_data=SAMPLE_REPORT_DICT
    )
    sections = set(c.section for c in chunks)
    assert "Film Overview" in sections
    assert "Executive Summary" in sections
    assert "Cinematography" in sections
    assert "Commercial Analysis" in sections
    assert "Creative Assessment" in sections
    assert "Strategic Recommendations" in sections


def test_chunking_preserves_metrics_and_timestamps():
    chunks = ReportChunker.chunk_report(
        film_id="film_abc_123",
        report_id="rep_test_001",
        report_data=SAMPLE_REPORT_DICT
    )
    # Find scene highlight chunk
    scene_chunks = [c for c in chunks if "Key Scene Highlights" in (c.subsection or "")]
    assert len(scene_chunks) == 1
    assert "00:04:12 - 00:06:45" in scene_chunks[0].timestamps

    # Find commercial risk chunk
    risk_chunks = [c for c in chunks if "Key Commercial Risk Factors" in (c.subsection or "")]
    assert len(risk_chunks) == 1
    assert risk_chunks[0].severity == "high"
    assert "Complex non-linear narrative" in risk_chunks[0].content
