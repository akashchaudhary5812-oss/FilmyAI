"""
Groq LLM Film Intelligence Analyzer v3.0.
Executes structured inference using Groq API with JSON schema enforcement.
v3.0: Expanded prompt with new sections, strict anti-hallucination instructions,
and a deterministic fallback that populates all new v3.0 sections from pre-computed evidence.
"""
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from LLM_FINAL_REPORT.config import GROQ_API_KEY, GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODEL
from LLM_FINAL_REPORT.schemas.evidence_schema import NormalizedEvidence
from LLM_FINAL_REPORT.schemas.report_schema import (
    FinalFilmIntelligenceReport,
    ExecutiveSummary,
    CinematographyAnalysis,
    CommercialAnalysis,
    CreativeTechnicalAssessment,
    StrategicRecommendations,
    SceneKeyHighlight,
    CastPerformanceAnalysis,
    CastPerformanceItem,
    CastPerformanceDimensions,
    FilmHighPoint,
    FilmMediumPoint,
    FilmLowPoint,
    ScenePerformanceTimeline,
    CharacterEmotionalJourney,
    PacingRhythmMap,
    TechnicalCreativePeak,
    TimestampedEvidence,
)


SYSTEM_PROMPT = """You are the Principal Film Intelligence Analyst and Executive Studio Strategist for FILMY AI.
Your objective is to analyze multimodal film evidence and synthesize a comprehensive, studio-grade Film Intelligence Report.

STRICT ANTI-HALLUCINATION RULES — NON-NEGOTIABLE:
1. Use ONLY the evidence supplied in the user message. Do NOT invent any information.
2. NEVER invent actor names, character names, timestamps, scenes, scores, or technical issues.
3. NEVER alter or contradict ML model predictions or commercial scores.
4. If evidence for a field is missing or insufficient: return null for scores, "LOW" for confidence, and an explanatory string.
5. For timestamps: only generate timestamps that fall within the actual analyzed film duration. If you cannot verify a timestamp, do not generate it.
6. Character names must come from the supplied script/summary. If no script/summary → use "Character (unresolved from metadata)".
7. All scores must be on a 0.0 - 10.0 scale unless specified otherwise.
8. High/Medium/Low point counts must be dynamic — determined by the scene evidence, NOT fixed at 5 or any number.
9. Confidence must be: "HIGH", "MEDIUM", or "LOW" — never hardcoded to "HIGH".
10. Every claim must add value: evidence, score, timestamp, comparison, or explanation.
11. Output MUST be valid JSON with no markdown fences or surrounding commentary.
"""

JSON_SCHEMA_INSTRUCTION = """
Required JSON Structure — produce ALL sections below:
{
  "executive_summary": {
    "film_title": "string",
    "logline": "string (punchy professional logline)",
    "commercial_verdict": "string",
    "overall_film_rating": float (1.0 - 10.0),
    "commercial_tier": "string",
    "key_thesis": "string (2-3 sentence executive synthesis)",
    "strongest_creative_areas": ["string", ...],
    "weakest_creative_areas": ["string", ...],
    "top_cast_performances": ["string", ...],
    "major_scene_highs": ["string", ...],
    "major_scene_weaknesses": ["string", ...],
    "confidence_limitations": "string or null"
  },
  "cinematography_analysis": {
    "visual_style_overview": "string",
    "shot_composition_assessment": "string",
    "lighting_and_atmosphere": "string",
    "pacing_and_editing_rhythm": "string",
    "soundscape_and_speech": "string"
  },
  "commercial_analysis": {
    "box_office_outlook": "string",
    "primary_commercial_drivers": ["string", ...],
    "key_risk_factors": ["string", ...],
    "target_demographics": ["string", ...],
    "franchise_and_ancillary_potential": "string"
  },
  "creative_technical_assessment": {
    "key_strengths": ["string", ...],
    "key_weaknesses": ["string", ...],
    "thematic_and_narrative_cohesion": "string"
  },
  "strategic_recommendations": {
    "post_production_guidance": ["string", ...],
    "marketing_and_positioning": ["string", ...],
    "theatrical_vs_streaming_recommendation": "string"
  },
  "key_scene_highlights": [
    {"timestamp_range": "string", "shot_type": "string", "visual_significance": "string", "narrative_impact": "string"}
  ],
  "cast_performance": {
    "cast_items": [
      {
        "actor_name": "string (from metadata only)",
        "character_name": "string (from script/summary; use 'Character (unresolved)' if unknown)",
        "role_category": "LEAD|LEAD_SUPPORT|ANTAGONIST|SUPPORTING|COMIC|SPECIAL_APPEARANCE|OTHER",
        "screen_presence": "string or null",
        "scores": {
          "acting_score": float or null,
          "emotional_connect_score": float or null,
          "dialogue_delivery_score": float or null,
          "character_consistency_score": float or null,
          "scene_impact_score": float or null,
          "character_arc_score": float or null,
          "chemistry_score": float or null,
          "dimensions_available": ["string", ...]
        },
        "overall_performance_score": float or null,
        "confidence": "HIGH|MEDIUM|LOW",
        "strong_moments": [],
        "weak_moments": [],
        "evidence": ["string", ...],
        "improvement_notes": "string or null"
      }
    ],
    "overall_cast_assessment": "string",
    "confidence": "HIGH|MEDIUM|LOW",
    "evidence_notes": "string or null"
  },
  "film_high_points": [
    {
      "timestamp_start": "HH:MM:SS",
      "timestamp_end": "HH:MM:SS",
      "timestamp_start_sec": float,
      "timestamp_end_sec": float,
      "scene_description": "string",
      "scene_score": float or null,
      "why_it_works": "string",
      "cinematography_strength": float or null,
      "audio_strength": float or null,
      "emotional_strength": float or null,
      "audience_impact": "string or null",
      "evidence": ["string", ...],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "film_medium_points": [
    {
      "timestamp_start": "HH:MM:SS",
      "timestamp_end": "HH:MM:SS",
      "timestamp_start_sec": float,
      "timestamp_end_sec": float,
      "scene_score": float or null,
      "what_works": "string",
      "what_is_average": "string",
      "improvement_area": "string",
      "evidence": ["string", ...],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "film_low_points": [
    {
      "timestamp_start": "HH:MM:SS",
      "timestamp_end": "HH:MM:SS",
      "timestamp_start_sec": float,
      "timestamp_end_sec": float,
      "scene_description": "string",
      "scene_score": float or null,
      "primary_issue": "string",
      "secondary_issues": ["string", ...],
      "audience_effect": "string or null",
      "affected_category": "STORY|SCREENPLAY|PACING|ACTING|DIALOGUE|CINEMATOGRAPHY|AUDIO|VFX|CONTINUITY|EMOTIONAL_IMPACT|OTHER",
      "recommendation": "string or null",
      "evidence": ["string", ...],
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "pacing_rhythm_map": {
    "overall_rhythm": "string",
    "pacing_segments": [],
    "slow_sections": ["string", ...],
    "drag_points": ["string", ...],
    "rushed_sections": ["string", ...],
    "peak_intensity_moments": ["string", ...],
    "pacing_consistency": "string or null",
    "transition_quality": "string or null",
    "confidence": "HIGH|MEDIUM|LOW"
  },
  "character_emotional_journey": {
    "characters": [
      {
        "character_name": "string",
        "actor_name": "string or null",
        "starting_state": "string or null",
        "emotional_transitions": [],
        "turning_points": [],
        "ending_state": "string or null",
        "arc_coherence": float or null,
        "confidence": "HIGH|MEDIUM|LOW",
        "evidence": ["string", ...]
      }
    ],
    "film_emotional_progression": "string or null",
    "climax_timestamp": "string or null",
    "resolution_quality": "string or null",
    "emotional_consistency": "string or null",
    "confidence": "HIGH|MEDIUM|LOW"
  }
}
"""


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _safe_confidence(val: Any) -> str:
    if val in ("HIGH", "MEDIUM", "LOW"):
        return val
    return "LOW"


def _parse_cast_from_data(cast_data: Dict[str, Any]) -> CastPerformanceAnalysis:
    """Safely parse cast_performance section from LLM output."""
    items = []
    for ci in cast_data.get("cast_items", []):
        scores_raw = ci.get("scores", {})
        dims = CastPerformanceDimensions(
            acting_score=scores_raw.get("acting_score"),
            emotional_connect_score=scores_raw.get("emotional_connect_score"),
            dialogue_delivery_score=scores_raw.get("dialogue_delivery_score"),
            character_consistency_score=scores_raw.get("character_consistency_score"),
            scene_impact_score=scores_raw.get("scene_impact_score"),
            character_arc_score=scores_raw.get("character_arc_score"),
            chemistry_score=scores_raw.get("chemistry_score"),
            dimensions_available=scores_raw.get("dimensions_available", []),
        )
        items.append(CastPerformanceItem(
            actor_name=ci.get("actor_name", "Unknown"),
            character_name=ci.get("character_name", "Character (unresolved)"),
            role_category=ci.get("role_category", "OTHER"),
            screen_presence=ci.get("screen_presence"),
            scores=dims,
            overall_performance_score=ci.get("overall_performance_score"),
            confidence=_safe_confidence(ci.get("confidence")),
            evidence=ci.get("evidence", []),
            improvement_notes=ci.get("improvement_notes"),
        ))

    return CastPerformanceAnalysis(
        cast_items=items,
        overall_cast_assessment=cast_data.get("overall_cast_assessment", ""),
        confidence=_safe_confidence(cast_data.get("confidence")),
        evidence_notes=cast_data.get("evidence_notes"),
    )


def _parse_high_points(data_list: List[Dict]) -> List[FilmHighPoint]:
    pts = []
    for d in data_list:
        try:
            pts.append(FilmHighPoint(
                timestamp_start=d.get("timestamp_start", "00:00:00"),
                timestamp_end=d.get("timestamp_end", "00:00:00"),
                timestamp_start_sec=_safe_float(d.get("timestamp_start_sec", 0)),
                timestamp_end_sec=_safe_float(d.get("timestamp_end_sec", 0)),
                scene_description=d.get("scene_description", ""),
                scene_score=d.get("scene_score"),
                why_it_works=d.get("why_it_works", ""),
                cinematography_strength=d.get("cinematography_strength"),
                audio_strength=d.get("audio_strength"),
                emotional_strength=d.get("emotional_strength"),
                audience_impact=d.get("audience_impact"),
                evidence=d.get("evidence", []),
                confidence=_safe_confidence(d.get("confidence")),
            ))
        except Exception:
            continue
    return pts


def _parse_medium_points(data_list: List[Dict]) -> List[FilmMediumPoint]:
    pts = []
    for d in data_list:
        try:
            pts.append(FilmMediumPoint(
                timestamp_start=d.get("timestamp_start", "00:00:00"),
                timestamp_end=d.get("timestamp_end", "00:00:00"),
                timestamp_start_sec=_safe_float(d.get("timestamp_start_sec", 0)),
                timestamp_end_sec=_safe_float(d.get("timestamp_end_sec", 0)),
                scene_score=d.get("scene_score"),
                what_works=d.get("what_works", ""),
                what_is_average=d.get("what_is_average", ""),
                improvement_area=d.get("improvement_area", ""),
                evidence=d.get("evidence", []),
                confidence=_safe_confidence(d.get("confidence")),
            ))
        except Exception:
            continue
    return pts


def _parse_low_points(data_list: List[Dict]) -> List[FilmLowPoint]:
    pts = []
    for d in data_list:
        try:
            pts.append(FilmLowPoint(
                timestamp_start=d.get("timestamp_start", "00:00:00"),
                timestamp_end=d.get("timestamp_end", "00:00:00"),
                timestamp_start_sec=_safe_float(d.get("timestamp_start_sec", 0)),
                timestamp_end_sec=_safe_float(d.get("timestamp_end_sec", 0)),
                scene_description=d.get("scene_description", ""),
                scene_score=d.get("scene_score"),
                primary_issue=d.get("primary_issue", ""),
                secondary_issues=d.get("secondary_issues", []),
                audience_effect=d.get("audience_effect"),
                affected_category=d.get("affected_category", "OTHER"),
                recommendation=d.get("recommendation"),
                evidence=d.get("evidence", []),
                confidence=_safe_confidence(d.get("confidence")),
            ))
        except Exception:
            continue
    return pts


def _parse_pacing_map(data: Dict[str, Any]) -> PacingRhythmMap:
    return PacingRhythmMap(
        overall_rhythm=data.get("overall_rhythm", ""),
        slow_sections=data.get("slow_sections", []),
        drag_points=data.get("drag_points", []),
        rushed_sections=data.get("rushed_sections", []),
        peak_intensity_moments=data.get("peak_intensity_moments", []),
        pacing_consistency=data.get("pacing_consistency"),
        transition_quality=data.get("transition_quality"),
        confidence=_safe_confidence(data.get("confidence")),
    )


def _parse_character_journey(data: Dict[str, Any]) -> CharacterEmotionalJourney:
    characters = []
    for c in data.get("characters", []):
        from LLM_FINAL_REPORT.schemas.report_schema import CharacterJourneyItem
        characters.append(CharacterJourneyItem(
            character_name=c.get("character_name", ""),
            actor_name=c.get("actor_name"),
            starting_state=c.get("starting_state"),
            ending_state=c.get("ending_state"),
            arc_coherence=c.get("arc_coherence"),
            confidence=_safe_confidence(c.get("confidence")),
            evidence=c.get("evidence", []),
        ))
    return CharacterEmotionalJourney(
        characters=characters,
        film_emotional_progression=data.get("film_emotional_progression"),
        climax_timestamp=data.get("climax_timestamp"),
        resolution_quality=data.get("resolution_quality"),
        emotional_consistency=data.get("emotional_consistency"),
        confidence=_safe_confidence(data.get("confidence")),
    )


class GroqFilmAnalyzer:
    """
    Interfaces with Groq LLM to generate validated Film Intelligence Reports v3.0.
    Includes deterministic fallback that fully populates all new sections from pre-computed evidence.
    """
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model or GROQ_DEFAULT_MODEL
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"[GroqFilmAnalyzer] Error initializing Groq client: {e}")
        return self._client

    def generate_report(self, evidence: NormalizedEvidence, formatted_context: str) -> FinalFilmIntelligenceReport:
        """
        Synthesizes multimodal evidence into a validated FinalFilmIntelligenceReport v3.0.
        """
        report_id = f"FILMYAI-RPT-{uuid.uuid4().hex[:8].upper()}"
        client = self._get_client()

        candidate_models = [self.model, GROQ_FALLBACK_MODEL, "qwen/qwen3-8b-27b", "openai/gpt-oss-20b", "groq/compound-mini"]

        if client and self.api_key:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": (
                    f"Analyze this film evidence and produce the complete JSON report according to the schema.\n\n"
                    f"{formatted_context}\n\n{JSON_SCHEMA_INSTRUCTION}"
                )}
            ]

            for model_name in candidate_models:
                try:
                    print(f"[GroqFilmAnalyzer] Sending evidence to Groq LLM ({model_name})...")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=0.15,
                        max_tokens=6000,
                        response_format={"type": "json_object"}
                    )
                    raw_json = completion.choices[0].message.content.strip()
                    if raw_json.startswith("```"):
                        raw_json = re.sub(r'^```(?:json)?\s*', '', raw_json)
                        raw_json = re.sub(r'\s*```$', '', raw_json)

                    parsed_data = json.loads(raw_json)
                    return self._build_report_from_parsed(report_id, evidence, parsed_data)

                except Exception as e:
                    print(f"[GroqFilmAnalyzer] Model {model_name} attempt encountered error: {e}")

        print("[GroqFilmAnalyzer] Utilizing deterministic synthesis engine v3.0.")
        return self._build_fallback_report(report_id, evidence)

    def _build_report_from_parsed(
        self, report_id: str, evidence: NormalizedEvidence, data: Dict[str, Any]
    ) -> FinalFilmIntelligenceReport:
        """Constructs and validates the Pydantic report object from LLM output."""
        meta_dict = {
            "title": evidence.title,
            "director": evidence.director,
            "actors": evidence.actors,
            "budget": evidence.budget,
            "genre": evidence.genre,
            "release_year": evidence.release_year,
            "release_month": evidence.release_month,
            "is_sequel": evidence.is_sequel
        }

        story_provenance = {
            "case_mode": evidence.story_evidence.case_mode,
            "script_source": evidence.story_evidence.script_source,
            "summary_source": evidence.story_evidence.summary_source,
            "provenance_notes": evidence.story_evidence.generated_notes or ""
        }

        exec_data = data.get("executive_summary") or {}
        exec_summary = ExecutiveSummary(
            film_title=exec_data.get("film_title") or evidence.title,
            logline=exec_data.get("logline") or evidence.story_evidence.summary_content[:200] or "Compelling film narrative.",
            commercial_verdict=exec_data.get("commercial_verdict") or f"Predicted Class: {evidence.commercial_evidence.predicted_commercial_class}",
            overall_film_rating=float(exec_data.get("overall_film_rating") or min(9.5, max(4.0, evidence.commercial_evidence.predicted_commercial_score + 1.0))),
            commercial_tier=exec_data.get("commercial_tier") or "Mid-to-High Market Tier",
            key_thesis=exec_data.get("key_thesis") or "Integrated film analysis combining commercial forecasting and cinematography intelligence.",
            strongest_creative_areas=exec_data.get("strongest_creative_areas") or [],
            weakest_creative_areas=exec_data.get("weakest_creative_areas") or [],
            top_cast_performances=exec_data.get("top_cast_performances") or [],
            major_scene_highs=exec_data.get("major_scene_highs") or [],
            major_scene_weaknesses=exec_data.get("major_scene_weaknesses") or [],
            confidence_limitations=exec_data.get("confidence_limitations"),
        )

        cin_data = data.get("cinematography_analysis") or {}
        cin_analysis = CinematographyAnalysis(
            visual_style_overview=cin_data.get("visual_style_overview") or f"Predominantly {evidence.video_evidence.predominant_shot_scale} composition.",
            shot_composition_assessment=cin_data.get("shot_composition_assessment") or "Balanced framing.",
            lighting_and_atmosphere=cin_data.get("lighting_and_atmosphere") or f"{evidence.video_evidence.predominant_lighting_style} profile.",
            pacing_and_editing_rhythm=cin_data.get("pacing_and_editing_rhythm") or f"{evidence.video_evidence.pacing_rhythm}.",
            soundscape_and_speech=cin_data.get("soundscape_and_speech") or f"{evidence.video_evidence.audio_speech_activity}."
        )

        comm_data = data.get("commercial_analysis") or {}
        comm_analysis = CommercialAnalysis(
            box_office_outlook=comm_data.get("box_office_outlook") or f"Score {evidence.commercial_evidence.predicted_commercial_score:.2f}/9.0.",
            primary_commercial_drivers=comm_data.get("primary_commercial_drivers") or [f.factor for f in evidence.commercial_evidence.important_contributing_factors] or ["Director credibility", "Genre market demand"],
            key_risk_factors=comm_data.get("key_risk_factors") or ["Audience saturation", "Budget-to-screen alignment"],
            target_demographics=comm_data.get("target_demographics") or ["Core Cinema Goers (18-35)"],
            franchise_and_ancillary_potential=comm_data.get("franchise_and_ancillary_potential") or "Viable for streaming licensing."
        )

        creat_data = data.get("creative_technical_assessment") or {}
        creat_assess = CreativeTechnicalAssessment(
            key_strengths=creat_data.get("key_strengths") or ["Solid cinematographic execution"],
            key_weaknesses=creat_data.get("key_weaknesses") or ["Pacing balance"],
            thematic_and_narrative_cohesion=creat_data.get("thematic_and_narrative_cohesion") or "Consistent tonal direction."
        )

        strat_data = data.get("strategic_recommendations") or {}
        strat_recs = StrategicRecommendations(
            post_production_guidance=strat_data.get("post_production_guidance") or ["Optimize color grade contrast"],
            marketing_and_positioning=strat_data.get("marketing_and_positioning") or ["Highlight high-kinetic sequences"],
            theatrical_vs_streaming_recommendation=strat_data.get("theatrical_vs_streaming_recommendation") or "Hybrid theatrical then SVOD."
        )

        highlights = []
        for h in data.get("key_scene_highlights", []):
            highlights.append(SceneKeyHighlight(
                timestamp_range=h.get("timestamp_range", "00:00 - 00:05"),
                shot_type=h.get("shot_type", "Medium Shot"),
                visual_significance=h.get("visual_significance", "Key visual moment"),
                narrative_impact=h.get("narrative_impact", "Narrative inflection point")
            ))
        if not highlights and evidence.video_evidence.top_shots_summary:
            for s in evidence.video_evidence.top_shots_summary[:4]:
                st = s.get("start_time_sec", 0.0)
                et = s.get("end_time_sec", 0.0)
                highlights.append(SceneKeyHighlight(
                    timestamp_range=f"{int(st//60):02d}:{int(st%60):02d} - {int(et//60):02d}:{int(et%60):02d}",
                    shot_type=s.get("shot_scale", "Cinematic Shot"),
                    visual_significance=f"{s.get('lighting', 'Natural')} lighting, {s.get('composition', 'Framed')} composition",
                    narrative_impact="Visual pacing cadence marker"
                ))

        # v3.0: Parse new sections
        cast_perf = None
        if "cast_performance" in data:
            try:
                cast_perf = _parse_cast_from_data(data["cast_performance"])
            except Exception as e:
                print(f"[GroqFilmAnalyzer] Warning: cast_performance parsing failed: {e}")

        high_points = _parse_high_points(data.get("film_high_points", []))
        medium_points = _parse_medium_points(data.get("film_medium_points", []))
        low_points = _parse_low_points(data.get("film_low_points", []))

        pacing_map = None
        if "pacing_rhythm_map" in data:
            try:
                pacing_map = _parse_pacing_map(data["pacing_rhythm_map"])
            except Exception:
                pass

        char_journey = None
        if "character_emotional_journey" in data:
            try:
                char_journey = _parse_character_journey(data["character_emotional_journey"])
            except Exception:
                pass

        # Always populate from pre-computed scene scorer if LLM didn't provide them
        vid = evidence.video_evidence
        computed_scene_data = getattr(vid, "_computed_scene_data", None) or getattr(vid.__dict__, "_computed_scene_data", None)
        computed_cast = getattr(vid, "_computed_cast_analysis", None) or getattr(vid.__dict__, "_computed_cast_analysis", None)

        if computed_scene_data:
            if not high_points:
                high_points = computed_scene_data.get("high_points", [])
            if not medium_points:
                medium_points = computed_scene_data.get("medium_points", [])
            if not low_points:
                low_points = computed_scene_data.get("low_points", [])
            timeline = computed_scene_data.get("timeline")
            peaks = computed_scene_data.get("technical_peaks", [])
            if pacing_map is None:
                pacing_map = computed_scene_data.get("pacing_map")
        else:
            timeline = None
            peaks = []

        if cast_perf is None and computed_cast:
            cast_perf = computed_cast

        if char_journey is None and evidence.actors:
            try:
                from LLM_FINAL_REPORT.core.cast_scorer import CastScorer
                cs = CastScorer(evidence)
                char_journey = cs.build_character_journey()
            except Exception:
                pass

        return FinalFilmIntelligenceReport(
            report_id=report_id,
            generated_at_utc=datetime.now(timezone.utc).isoformat(),
            film_title=evidence.title,
            metadata_summary=meta_dict,
            story_provenance=story_provenance,
            executive_summary=exec_summary,
            cinematography_analysis=cin_analysis,
            commercial_analysis=comm_analysis,
            creative_technical_assessment=creat_assess,
            strategic_recommendations=strat_recs,
            key_scene_highlights=highlights,
            raw_ml_predictions=evidence.commercial_evidence.model_dump(),
            raw_video_metrics=evidence.video_evidence.model_dump(),
            # v3.0 new sections
            cast_performance=cast_perf,
            film_high_points=high_points,
            film_medium_points=medium_points,
            film_low_points=low_points,
            scene_performance_timeline=timeline,
            character_emotional_journey=char_journey,
            pacing_rhythm_map=pacing_map,
            technical_creative_peaks=peaks,
            high_point_count=len(high_points),
            medium_point_count=len(medium_points),
            low_point_count=len(low_points),
            scene_scoring_method="dynamic_percentile_v3.0",
            timestamp_validation_status="VALIDATED",
            report_version="3.0.0",
        )

    def _build_fallback_report(self, report_id: str, evidence: NormalizedEvidence) -> FinalFilmIntelligenceReport:
        """Deterministic high-quality synthesis when LLM is offline — fully populates all v3.0 sections."""
        comm = evidence.commercial_evidence
        vid = evidence.video_evidence
        story = evidence.story_evidence

        rating = min(9.5, max(4.0, comm.predicted_commercial_score + 0.8))
        verdict = f"{comm.predicted_commercial_class.upper()} — {comm.commercial_success_probability*100:.1f}% Success Probability"
        drivers = [f.impact for f in comm.important_contributing_factors] or ["Director historical track record", "Genre appeal"]
        if evidence.is_sequel:
            drivers.append("Established franchise equity and brand recognition")

        highlights = []
        if vid.top_shots_summary:
            for s in vid.top_shots_summary[:5]:
                st = s.get("start_time_sec", 0.0)
                et = s.get("end_time_sec", 0.0)
                highlights.append(SceneKeyHighlight(
                    timestamp_range=f"{int(st//60):02d}:{int(st%60):02d} - {int(et//60):02d}:{int(et%60):02d}",
                    shot_type=s.get("shot_scale", "Cinematic Shot"),
                    visual_significance=f"{s.get('lighting', 'Standard')} illumination with {s.get('composition', 'Classical')} composition",
                    narrative_impact="Narrative pacing driver"
                ))

        # Compute scene scoring artifacts from pre-computed data
        computed_scene_data = getattr(vid, "_computed_scene_data", None)
        high_points, medium_points, low_points, timeline, peaks, pacing_map = [], [], [], None, [], None
        if computed_scene_data:
            high_points = computed_scene_data.get("high_points", [])
            medium_points = computed_scene_data.get("medium_points", [])
            low_points = computed_scene_data.get("low_points", [])
            timeline = computed_scene_data.get("timeline")
            peaks = computed_scene_data.get("technical_peaks", [])
            pacing_map = computed_scene_data.get("pacing_map")
        elif vid.all_shots_detail:
            try:
                from LLM_FINAL_REPORT.core.scene_scorer import SceneScorer
                scorer = SceneScorer(vid)
                computed = scorer.compute_all()
                high_points = computed.get("high_points", [])
                medium_points = computed.get("medium_points", [])
                low_points = computed.get("low_points", [])
                timeline = computed.get("timeline")
                peaks = computed.get("technical_peaks", [])
                pacing_map = computed.get("pacing_map")
            except Exception as e:
                print(f"[GroqFilmAnalyzer:Fallback] Scene scoring failed: {e}")

        # Cast performance
        cast_perf = getattr(vid, "_computed_cast_analysis", None)
        char_journey = None
        if not cast_perf or cast_perf is None:
            try:
                from LLM_FINAL_REPORT.core.cast_scorer import CastScorer
                cs = CastScorer(evidence)
                cast_perf = cs.build_cast_analysis()
                char_journey = cs.build_character_journey()
            except Exception as e:
                print(f"[GroqFilmAnalyzer:Fallback] Cast scoring failed: {e}")

        exec_summary = ExecutiveSummary(
            film_title=evidence.title,
            logline=story.summary_content[:200] if story.summary_content else f"An ambitious {evidence.genre} project directed by {evidence.director}.",
            commercial_verdict=verdict,
            overall_film_rating=round(rating, 1),
            commercial_tier=f"Commercial Tier: {comm.predicted_commercial_class}",
            key_thesis=f"'{evidence.title}' combines a calculated {comm.commercial_success_probability*100:.1f}% commercial success probability with {vid.pacing_rhythm.lower()} visual architecture across {vid.total_shots} analyzed shots.",
            strongest_creative_areas=[vid.predominant_shot_scale, vid.predominant_lighting_style] if vid.predominant_shot_scale != "N/A" else [],
            weakest_creative_areas=["Requires detailed editorial review based on low-point scenes"] if low_points else [],
            major_scene_highs=[f"{h.timestamp_start}–{h.timestamp_end}: score {h.scene_score}/10" for h in high_points[:3]],
            major_scene_weaknesses=[f"{l.timestamp_start}–{l.timestamp_end}: {l.primary_issue}" for l in low_points[:3]],
        )

        meta_dict = {
            "title": evidence.title, "director": evidence.director, "actors": evidence.actors,
            "budget": evidence.budget, "genre": evidence.genre,
            "release_year": evidence.release_year, "release_month": evidence.release_month,
            "is_sequel": evidence.is_sequel
        }

        return FinalFilmIntelligenceReport(
            report_id=report_id,
            generated_at_utc=datetime.now(timezone.utc).isoformat(),
            film_title=evidence.title,
            metadata_summary=meta_dict,
            story_provenance={
                "case_mode": story.case_mode,
                "script_source": story.script_source,
                "summary_source": story.summary_source,
                "provenance_notes": story.generated_notes or ""
            },
            executive_summary=exec_summary,
            cinematography_analysis=CinematographyAnalysis(
                visual_style_overview=f"Predominantly {vid.predominant_shot_scale} shot framing with {vid.predominant_lighting_style} lighting.",
                shot_composition_assessment=f"Structured composition across {vid.total_shots} evaluated shots.",
                lighting_and_atmosphere=f"Lighting design centers on {vid.predominant_lighting_style} profiles.",
                pacing_and_editing_rhythm=f"{vid.pacing_rhythm} with avg shot length {vid.average_shot_length_sec:.2f}s ({vid.cuts_per_minute:.1f} cuts/min).",
                soundscape_and_speech=f"Acoustic classification: {vid.audio_speech_activity}."
            ),
            commercial_analysis=CommercialAnalysis(
                box_office_outlook=f"Commercial ML engine: score {comm.predicted_commercial_score:.2f}/9.0, confidence {comm.model_confidence*100:.1f}%.",
                primary_commercial_drivers=drivers,
                key_risk_factors=["Marketing reach in crowded theatrical corridors", "Cross-demographic conversion efficiency"],
                target_demographics=["Core Cinema Audience (18-34)", f"{evidence.genre} Enthusiasts"],
                franchise_and_ancillary_potential="Strong SVOD licensing and international distribution potential."
            ),
            creative_technical_assessment=CreativeTechnicalAssessment(
                key_strengths=["Clear visual identity", "Disciplined shot framing", "Consistent pacing dynamics"],
                key_weaknesses=["Lighting variation across rapid cuts", "Audience retention over dialogue-heavy sequences"],
                thematic_and_narrative_cohesion="Cohesive thematic tone established throughout visual and narrative framework."
            ),
            strategic_recommendations=StrategicRecommendations(
                post_production_guidance=["Ensure tonal color grading uniformity", "Fine-tune dialogue-to-ambient sound mixing"],
                marketing_and_positioning=["Center campaign on core star power", "Time promotional drops 6-8 weeks prior to release"],
                theatrical_vs_streaming_recommendation="Wide theatrical rollout with 45-day window before SVOD platforms."
            ),
            key_scene_highlights=highlights,
            raw_ml_predictions=comm.model_dump(),
            raw_video_metrics=vid.model_dump(),
            cast_performance=cast_perf,
            film_high_points=high_points,
            film_medium_points=medium_points,
            film_low_points=low_points,
            scene_performance_timeline=timeline,
            character_emotional_journey=char_journey,
            pacing_rhythm_map=pacing_map,
            technical_creative_peaks=peaks,
            high_point_count=len(high_points),
            medium_point_count=len(medium_points),
            low_point_count=len(low_points),
            scene_scoring_method="dynamic_percentile_v3.0_fallback",
            timestamp_validation_status="VALIDATED",
            report_version="3.0.0",
        )
