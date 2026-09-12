"""
Evidence Normalizer Module.
Consolidates raw predictions from ML, multimodal findings from ML_VIDEO,
metadata, and story context into structured, unified evidence.
"""
from datetime import datetime, timezone
from typing import Dict, Any

from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest
from LLM_FINAL_REPORT.schemas.evidence_schema import (
    NormalizedEvidence,
    CommercialEvidence,
    VideoCinematographyEvidence,
    StoryContextEvidence
)


class EvidenceNormalizer:
    """
    Combines disparate ML outputs into a standardized evidence package for LLM synthesis.
    """

    @staticmethod
    def normalize(
        request: FilmInputRequest,
        commercial_evidence: CommercialEvidence,
        video_evidence: VideoCinematographyEvidence,
        story_evidence: StoryContextEvidence
    ) -> NormalizedEvidence:
        """
        Creates a single unified NormalizedEvidence schema.
        """
        return NormalizedEvidence(
            title=request.title,
            director=request.director,
            actors=request.actors,
            production_houses=request.production_houses,
            budget=request.budget,
            genre=request.genre,
            release_year=request.release_year,
            release_month=request.release_month,
            is_sequel=request.is_sequel,
            commercial_evidence=commercial_evidence,
            video_evidence=video_evidence,
            story_evidence=story_evidence,
            timestamp_utc=datetime.now(timezone.utc).isoformat()
        )

    @staticmethod
    def format_llm_context(evidence: NormalizedEvidence) -> str:
        """
        Formats normalized evidence into an ultra-clean, structured prompt context block for Groq LLM.
        """
        comm = evidence.commercial_evidence
        vid = evidence.video_evidence
        story = evidence.story_evidence

        factors_str = "\n".join([f"  - {f.factor}: {f.impact}" for f in comm.important_contributing_factors]) or "  - Standard historical market baseline"

        shot_scale_str = ", ".join([f"{k} ({v.get('percentage', 0)}%)" for k, v in vid.shot_scale_distribution.items()]) or "Not available"
        lighting_str = ", ".join([f"{k} ({v.get('percentage', 0)}%)" for k, v in vid.lighting_style_distribution.items()]) or "Not available"

        return f"""
================================================================================
FILM IDENTIFICATION & METADATA
================================================================================
- Title: {evidence.title}
- Director: {evidence.director}
- Cast / Stars: {', '.join(evidence.actors) if evidence.actors else 'Unspecified'}
- Production Houses: {', '.join(evidence.production_houses) if evidence.production_houses else 'Independent'}
- Budget: ${evidence.budget:,.2f} USD ({'Specified' if evidence.budget > 0 else 'Unspecified / Low Budget'})
- Primary Genre: {evidence.genre}
- Release Timeline: {evidence.release_month:02d}/{evidence.release_year} (Sequel/Franchise: {'Yes' if evidence.is_sequel else 'No'})

================================================================================
STORY & SCREENPLAY CONTEXT (Priority: {story.case_mode})
================================================================================
- Script Source: {story.script_source}
- Summary Source: {story.summary_source}
- Provenance Notes: {story.generated_notes}

[FILM SYNOPSIS / LOGLINE]
{story.summary_content}

[SCREENPLAY / SEQUENCE BREAKDOWN]
{story.script_content or 'Not provided (analyzed from visuals)'}

================================================================================
COMMERCIAL MODEL PREDICTIONS (ML/ Engine v{comm.model_version})
================================================================================
- Status: {comm.status.upper()}
- Predicted Commercial Category: {comm.predicted_commercial_class.upper()} (Class Code: {comm.predicted_class_code})
- Commercial Success Probability (Hit / Super Hit): {comm.commercial_success_probability * 100:.1f}%
- Model Confidence: {comm.model_confidence * 100:.1f}%
- Predicted Commercial Score: {comm.predicted_commercial_score:.2f} / 9.0 (Scale: {comm.commercial_score_scale})
- Class Distribution: {comm.class_probabilities}
- Key Factors Driving Prediction:
{factors_str}
- Unsupported Estimations in ML Model: IMDb Score = {comm.imdb_rating_prediction}, Exact Box Office $ = {comm.box_office_numeric_prediction}

================================================================================
VIDEO & CINEMATOGRAPHY MULTIMODAL INTELLIGENCE (ML_VIDEO/ v{vid.engine_version})
================================================================================
- Video Status: {vid.status.upper()}
- Duration Analyzed: {vid.duration_seconds:.2f} seconds | Resolution: {vid.resolution} ({vid.aspect_ratio})
- Structural Segmentation: {vid.total_scenes} scene(s), {vid.total_shots} shot(s)
- Pacing & Rhythm: {vid.pacing_rhythm} (Avg Shot Length: {vid.average_shot_length_sec:.2f}s, Cuts/Min: {vid.cuts_per_minute})
- Predominant Shot Scale: {vid.predominant_shot_scale}
- Shot Scale Breakdown: {shot_scale_str}
- Predominant Lighting Style: {vid.predominant_lighting_style}
- Lighting Breakdown: {lighting_str}
- Audio & Acoustic Mode: {vid.audio_speech_activity}
================================================================================
"""
