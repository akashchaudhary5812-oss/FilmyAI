"""
Unit tests for Script and Summary Strict Precedence Rules (Cases 1, 2, 3, 4).
"""
import pytest
from LLM_FINAL_REPORT.core.script_summary_manager import ScriptSummaryManager
from LLM_FINAL_REPORT.schemas.evidence_schema import VideoCinematographyEvidence


@pytest.fixture
def mock_video_evidence():
    return VideoCinematographyEvidence(
        status="available",
        engine_version="2.0.0",
        video_source="test_trailer.mp4",
        duration_seconds=45.0,
        total_scenes=2,
        total_shots=12,
        average_shot_length_sec=3.75,
        pacing_rhythm="Moderate Cinematic Narrative Pacing",
        predominant_shot_scale="mediumCloseUp",
        predominant_lighting_style="High-key Studio",
        audio_speech_activity="SPEECH_WITH_MUSIC"
    )


def test_case_1_script_and_summary_provided(mock_video_evidence):
    """Case 1: User provides both script and summary. Neither should be replaced or regenerated."""
    user_script = "INT. CONTROL ROOM - NIGHT. Dr. Roy stares at the oscillating waveform."
    user_summary = "A brilliant quantum physicist discovers an anomaly that alters time."

    res = ScriptSummaryManager.resolve_story_context(
        user_script=user_script,
        user_summary=user_summary,
        video_evidence=mock_video_evidence,
        film_title="Quantum Echo",
        genre="Sci-Fi"
    )

    assert res.case_mode == "CASE_1"
    assert res.script_source == "USER_PROVIDED"
    assert res.summary_source == "USER_PROVIDED"
    assert res.script_content == user_script
    assert res.summary_content == user_summary
    assert "No AI fallback regeneration" in res.generated_notes


def test_case_2_script_provided_summary_missing(mock_video_evidence):
    """Case 2: User provides script, summary missing. Summary generated; script preserved."""
    user_script = "EXT. RACETRACK - DAY. Tires screech as the vintage sports car enters the bend."

    res = ScriptSummaryManager.resolve_story_context(
        user_script=user_script,
        user_summary=None,
        video_evidence=mock_video_evidence,
        film_title="Apex Velocity",
        genre="Action"
    )

    assert res.case_mode == "CASE_2"
    assert res.script_source == "USER_PROVIDED"
    assert res.summary_source == "AI_GENERATED"
    assert res.script_content == user_script
    assert "[AI-generated" in res.summary_content
    assert "Apex Velocity" in res.summary_content


def test_case_3_script_missing_summary_provided(mock_video_evidence):
    """Case 3: User provides summary, script missing. Script context generated; summary preserved."""
    user_summary = "Two estranged siblings must reunite to save their ancestral estate."

    res = ScriptSummaryManager.resolve_story_context(
        user_script=None,
        user_summary=user_summary,
        video_evidence=mock_video_evidence,
        film_title="The Heritage",
        genre="Drama"
    )

    assert res.case_mode == "CASE_3"
    assert res.script_source == "AI_GENERATED"
    assert res.summary_source == "USER_PROVIDED"
    assert res.summary_content == user_summary
    assert "[AI-generated from video analysis]" in res.script_content
    assert "12 shots across 2 sequence(s)" in res.script_content


def test_case_4_script_missing_summary_missing(mock_video_evidence):
    """Case 4: Both missing. Both summary and script sequence context are AI generated."""
    res = ScriptSummaryManager.resolve_story_context(
        user_script=None,
        user_summary=None,
        video_evidence=mock_video_evidence,
        film_title="Shadow Protocol",
        genre="Thriller"
    )

    assert res.case_mode == "CASE_4"
    assert res.script_source == "AI_GENERATED"
    assert res.summary_source == "AI_GENERATED"
    assert "[AI-generated from video analysis]" in res.summary_content
    assert "[AI-generated from video analysis]" in res.script_content
