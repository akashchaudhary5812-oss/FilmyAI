"""
Deep Evidence-Driven Final Report v3.0 Tests:
- Schema validation & backward compatibility
- Dynamic Scene Scorer (High, Medium, Low points & counts)
- Cast Performance Scorer (Actors, screen presence, dimension scores, standout moments)
- Scene Performance Timeline & Pacing Rhythm
- Full End-to-End Pipeline v3.0 JSON & PDF generation
"""
import pytest
from pathlib import Path
from LLM_FINAL_REPORT.schemas.report_schema import (
    FinalFilmIntelligenceReport,
    CastPerformanceAnalysis,
    CastPerformanceItem,
    FilmHighPoint,
    FilmMediumPoint,
    FilmLowPoint,
    ScenePerformanceTimeline,
    CharacterEmotionalJourney,
    PacingRhythmMap,
    TechnicalCreativePeak,
)
from LLM_FINAL_REPORT.schemas.evidence_schema import (
    NormalizedEvidence,
    VideoCinematographyEvidence,
    CommercialEvidence,
    StoryContextEvidence,
)
from LLM_FINAL_REPORT.core.scene_scorer import SceneScorer
from LLM_FINAL_REPORT.core.cast_scorer import CastScorer
from LLM_FINAL_REPORT.core.evidence_normalizer import EvidenceNormalizer
from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline


def test_v3_schema_defaults_and_backward_compatibility():
    """Validates that a minimal v2 report can be parsed into v3 without errors."""
    minimal_v2_data = {
        "report_id": "FILM_REP_TEST_001",
        "generated_at_utc": "2026-09-19T00:00:00Z",
        "film_title": "Legacy Test Film",
        "metadata_summary": {"genre": "Action"},
        "story_provenance": {
            "script_source": "USER_PROVIDED",
            "summary_source": "USER_PROVIDED",
        },
        "executive_summary": {
            "film_title": "Legacy Test Film",
            "logline": "A high-stakes mission unfolds.",
            "commercial_verdict": "High Commercial Potential",
            "overall_film_rating": 8.5,
            "commercial_tier": "Major Studio Tier",
            "key_thesis": "Strong narrative and production values.",
        },
        "cinematography_analysis": {
            "visual_style_overview": "Stylized visual palette.",
            "shot_composition_assessment": "Balanced dynamic framing.",
            "lighting_and_atmosphere": "Naturalistic tones.",
            "pacing_and_editing_rhythm": "Fast montage pacing.",
            "soundscape_and_speech": "Clear audio.",
        },
        "commercial_analysis": {
            "box_office_outlook": "Strong theatrical trajectory.",
            "primary_commercial_drivers": ["Star Lead", "Visual Scope"],
            "key_risk_factors": ["High Budget"],
            "target_demographics": ["All Audiences"],
            "franchise_and_ancillary_potential": "High sequel viability.",
        },
        "creative_technical_assessment": {
            "key_strengths": ["Direction", "Visuals"],
            "key_weaknesses": ["Pacing lull"],
            "thematic_and_narrative_cohesion": "Cohesive throughout.",
        },
        "strategic_recommendations": {
            "post_production_guidance": ["Color grade boost"],
            "marketing_and_positioning": ["Action-focused teaser"],
            "theatrical_vs_streaming_recommendation": "Theatrical release first.",
        },
    }

    report = FinalFilmIntelligenceReport.model_validate(minimal_v2_data)
    assert report.report_id == "FILM_REP_TEST_001"
    assert report.report_version == "3.0.0"
    assert report.film_high_points == []
    assert report.film_medium_points == []
    assert report.film_low_points == []
    assert report.cast_performance is None
    assert report.scene_performance_timeline is None


def test_dynamic_scene_scorer():
    """Validates dynamic scene classification into high, medium, and low points."""
    mock_shots = [
        {
            "shot_id": 1,
            "start_time_sec": 0.0,
            "end_time_sec": 30.0,
            "duration_sec": 30.0,
            "shot_scale": {"predicted_class": "CLOSE_UP", "confidence": 0.95},
            "cinematography": {
                "lighting": {"style": "Golden Hour", "confidence": 0.9},
                "composition": {"rule_detected": "Rule of Thirds", "confidence": 0.92},
            },
            "motion": {"predicted_class": "SLOW_PAN"},
        },
        {
            "shot_id": 2,
            "start_time_sec": 30.0,
            "end_time_sec": 60.0,
            "duration_sec": 30.0,
            "shot_scale": {"predicted_class": "EXTREME_LONG_SHOT", "confidence": 0.5},
            "cinematography": {
                "lighting": {"style": "Flat Ambient", "confidence": 0.4},
                "composition": {"rule_detected": "None", "confidence": 0.3},
            },
            "motion": {"predicted_class": "HANDHELD_SHAKY"},
        },
        {
            "shot_id": 3,
            "start_time_sec": 60.0,
            "end_time_sec": 90.0,
            "duration_sec": 30.0,
            "shot_scale": {"predicted_class": "MEDIUM_SHOT", "confidence": 0.75},
            "cinematography": {
                "lighting": {"style": "Natural Daylight", "confidence": 0.7},
                "composition": {"rule_detected": "Center Balanced", "confidence": 0.7},
            },
            "motion": {"predicted_class": "STATIC"},
        },
    ]

    vid_evidence = VideoCinematographyEvidence(
        status="available",
        duration_seconds=90.0,
        total_shots=3,
        average_shot_length_sec=30.0,
        all_shots_detail=mock_shots,
    )

    scorer = SceneScorer(vid_evidence)
    timeline = scorer.build_timeline()
    assert len(timeline.entries) >= 1
    assert timeline.average_scene_score is not None

    pacing = scorer.build_pacing_map()
    assert len(pacing.pacing_segments) >= 1

    scored_shots = scorer._score_all_shots()
    from LLM_FINAL_REPORT.core.scene_scorer import _merge_adjacent_shots
    merged = _merge_adjacent_shots(scored_shots)
    highs, mediums, lows = scorer.classify_high_medium_low(merged)

    assert isinstance(highs, list)
    assert isinstance(mediums, list)
    assert isinstance(lows, list)


def test_cast_performance_scorer():
    """Validates evidence-driven cast performance analysis."""
    norm_evidence = NormalizedEvidence(
        title="Brahmastra Test",
        director="Ayan Mukerji",
        actors=["Ranbir Kapoor", "Deepika Padukone", "Saurabh Shukla"],
        production_houses=["Dharma Productions"],
        budget=350000000,
        genre="Action / Fantasy",
        release_year=2026,
        release_month=9,
        is_sequel=True,
        commercial_evidence=CommercialEvidence(
            predicted_commercial_class="SUPER_HIT",
            predicted_commercial_score=8.8,
            model_confidence=0.88,
        ),
        video_evidence=VideoCinematographyEvidence(
            status="available",
            duration_seconds=120.0,
            total_shots=24,
            average_shot_length_sec=5.0,
        ),
        story_evidence=StoryContextEvidence(
            case_mode="CASE_1",
            script_source="USER_PROVIDED",
            summary_source="USER_PROVIDED",
            script_content="Shiva unleashes monumental power as skies thunder.",
            summary_content="A hero discovers the ancient divine astras.",
        ),
        timestamp_utc="2026-09-19T00:00:00Z",
    )

    scorer = CastScorer(norm_evidence)
    cast_analysis = scorer.build_cast_analysis()

    assert len(cast_analysis.cast_items) == 3
    assert cast_analysis.cast_items[0].actor_name == "Ranbir Kapoor"
    assert cast_analysis.cast_items[0].overall_performance_score is not None
    assert cast_analysis.cast_items[0].scores.acting_score is not None
    assert isinstance(cast_analysis.cast_items[0].strong_moments, list)


def test_end_to_end_pipeline_v3_full(tmp_path):
    """Executes full pipeline and verifies output JSON and PDF have all v3 sections."""
    pipeline = FilmyAIReportPipeline(output_dir=tmp_path)

    request_data = {
        "FilmName": "Kalki 2898 AD",
        "DirectorName": "Nag Ashwin",
        "Casting": "Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone",
        "ProductionHouses": "Vyjayanthi Movies",
        "Budget": "600000000",
        "Genre": "Sci-Fi / Epic",
        "Script": "EXT. KASI STREETS - NIGHT. Ashwatthama stands firm, staff in hand, radiating monumental mythological gravitas as Bhairava charges on BUJJI.",
        "Summary": "In a dystopian post-apocalyptic future, immortal Ashwatthama protects the divine child from Supreme Yaskin's complex forces.",
        "generate_pdf": True,
    }

    report = pipeline.generate_report(request_data)

    assert report is not None
    assert report.film_title == "Kalki 2898 AD"
    assert report.report_version == "3.0.0"

    # Verify v3 sections populated
    assert report.cast_performance is not None
    assert len(report.cast_performance.cast_items) >= 2
    assert report.character_emotional_journey is not None

    # Verify PDF & JSON files created and valid
    assert report.json_report_path is not None
    assert Path(report.json_report_path).exists()
    assert report.pdf_report_path is not None
    assert Path(report.pdf_report_path).exists()
    assert Path(report.pdf_report_path).stat().st_size > 1000
