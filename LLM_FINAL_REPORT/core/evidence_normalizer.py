"""
Evidence Normalizer Module v3.0.
Consolidates raw predictions from ML, multimodal findings from ML_VIDEO,
metadata, and story context into structured, unified evidence.
v3.0 now also invokes SceneScorer and CastScorer to produce deep scene-level
intelligence before Groq LLM synthesis.
"""
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

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
        """Creates a single unified NormalizedEvidence schema."""
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
        v3.0: Includes scene-level scoring summary, cast evidence summary, and validation context.
        """
        comm = evidence.commercial_evidence
        vid = evidence.video_evidence
        story = evidence.story_evidence

        factors_str = "\n".join([
            f"  - {f.factor}: {f.impact}"
            for f in comm.important_contributing_factors
        ]) or "  - Standard historical market baseline"

        shot_scale_str = ", ".join([
            f"{k} ({v.get('percentage', 0)}%)"
            for k, v in vid.shot_scale_distribution.items()
        ]) or "Not available"
        lighting_str = ", ".join([
            f"{k} ({v.get('percentage', 0)}%)"
            for k, v in vid.lighting_style_distribution.items()
        ]) or "Not available"

        # v3.0: Generate scene score summary for LLM context
        scene_score_context = ""
        shot_detail_context = ""
        cast_context = ""

        if vid.all_shots_detail:
            try:
                from LLM_FINAL_REPORT.core.scene_scorer import SceneScorer
                scorer = SceneScorer(vid)
                scene_data = scorer.compute_all()

                timeline = scene_data.get("timeline")
                highs = scene_data.get("high_points", [])
                lows = scene_data.get("low_points", [])
                mediums = scene_data.get("medium_points", [])

                if timeline and timeline.entries:
                    entries_text = "\n".join([
                        f"  {e.timestamp_range}: score={e.scene_score or 'N/A'}, pacing={e.pacing_label or 'N/A'}"
                        for e in timeline.entries[:20]  # first 20 entries for context
                    ])
                    scene_score_context = f"""
================================================================================
SCENE PERFORMANCE TIMELINE (v3.0 Dynamic Scoring — {len(timeline.entries)} scenes)
================================================================================
Film Duration: {vid.duration_seconds:.1f}s
Avg Scene Score: {timeline.average_scene_score or 'N/A'}
Score Std Dev: {timeline.score_std_deviation or 'N/A'}
Timeline (chronological):
{entries_text}

High-Performing Scenes ({len(highs)} identified — score ≥ P70 & ≥ {6.5}):
{chr(10).join([f"  {h.timestamp_start}-{h.timestamp_end}: {h.scene_score}/10" for h in highs[:10]]) or '  None identified at this threshold.'}

Medium-Performing Scenes ({len(mediums)} identified):
  (Summary only — see full report sections)

Low-Performing Scenes ({len(lows)} identified — score ≤ P30 & ≤ {5.5}):
{chr(10).join([f"  {l.timestamp_start}-{l.timestamp_end}: {l.scene_score}/10 — {l.primary_issue}" for l in lows[:8]]) or '  None identified at this threshold.'}
"""

                # Store computed data on evidence for downstream use
                vid.__dict__["_computed_scene_data"] = scene_data

            except Exception as e:
                scene_score_context = f"\n[SCENE SCORING] Warning: Scene scoring computation failed: {e}\n"

        if evidence.actors:
            try:
                from LLM_FINAL_REPORT.core.cast_scorer import CastScorer
                cast_scorer = CastScorer(evidence)
                cast_analysis = cast_scorer.build_cast_analysis()

                cast_lines = []
                for ci in cast_analysis.cast_items:
                    dims = ci.scores
                    score_parts = []
                    if dims.acting_score is not None:
                        score_parts.append(f"Acting={dims.acting_score}")
                    if dims.emotional_connect_score is not None:
                        score_parts.append(f"Emotional={dims.emotional_connect_score}")
                    if dims.dialogue_delivery_score is not None:
                        score_parts.append(f"Dialogue={dims.dialogue_delivery_score}")
                    overall = f"Overall={ci.overall_performance_score}" if ci.overall_performance_score is not None else "Overall=null (insufficient evidence)"
                    cast_lines.append(
                        f"  [{ci.role_category}] {ci.actor_name}: {overall} | "
                        f"{', '.join(score_parts) or 'Insufficient dimensional evidence'} | "
                        f"Confidence={ci.confidence}"
                    )

                cast_context = f"""
================================================================================
CAST PERFORMANCE EVIDENCE (v3.0 — {len(cast_analysis.cast_items)} actors from metadata)
================================================================================
IMPORTANT: Character names should be resolved from the script/summary below.
These actors were sourced from supplied metadata — do NOT invent additional cast.
{chr(10).join(cast_lines) or '  No cast evidence available.'}

Note: {cast_analysis.evidence_notes or ''}
"""
                # Store computed cast analysis
                vid.__dict__["_computed_cast_analysis"] = cast_analysis
            except Exception as e:
                cast_context = f"\n[CAST SCORING] Warning: Cast scoring computation failed: {e}\n"

        # Shots detail summary (top 5 shots for LLM context)
        if vid.top_shots_summary:
            shots_text = "\n".join([
                f"  Shot {s.get('shot_id', '?')}: {_seconds_to_ts(s.get('start_time_sec', 0))} → {_seconds_to_ts(s.get('end_time_sec', 0))} | Scale={s.get('shot_scale', 'N/A')} | Lighting={s.get('lighting', 'N/A')}"
                for s in vid.top_shots_summary[:5]
            ])
            shot_detail_context = f"""
================================================================================
TOP REPRESENTATIVE SHOT ANALYSIS (from ML_VIDEO)
================================================================================
{shots_text}
"""

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
{shot_detail_context}{scene_score_context}{cast_context}================================================================================
"""


def _seconds_to_ts(sec: float) -> str:
    sec = max(0.0, float(sec))
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
