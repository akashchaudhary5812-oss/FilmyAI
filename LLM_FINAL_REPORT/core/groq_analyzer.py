"""
Groq LLM Film Intelligence Analyzer.
Executes structured inference using Groq API with JSON schema enforcement and robust fallbacks.
"""
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from LLM_FINAL_REPORT.config import GROQ_API_KEY, GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODEL
from LLM_FINAL_REPORT.schemas.evidence_schema import NormalizedEvidence
from LLM_FINAL_REPORT.schemas.report_schema import (
    FinalFilmIntelligenceReport,
    ExecutiveSummary,
    CinematographyAnalysis,
    CommercialAnalysis,
    CreativeTechnicalAssessment,
    StrategicRecommendations,
    SceneKeyHighlight
)


SYSTEM_PROMPT = """You are the Principal Film Intelligence Analyst and Executive Studio Strategist for FILMY AI.
Your objective is to analyze multimodal film evidence (commercial box-office predictions, visual/cinematographic measurements, acoustics, and screenplay context) and synthesize a comprehensive, studio-grade Film Intelligence Report.

IMPORTANT RULES:
1. Ground your analysis strictly in the provided evidence.
2. Honor script and summary provenance (USER_PROVIDED vs AI_GENERATED). Never contradict the provided facts.
3. Be professional, analytical, insightful, and cinematic in your writing style (akin to Hollywood development executives and senior cinematographers).
4. Output MUST be valid JSON adhering strictly to the required schema with no extra surrounding markdown or commentary.
"""

JSON_SCHEMA_INSTRUCTION = """
Required JSON Structure:
{
  "executive_summary": {
    "film_title": "string",
    "logline": "string",
    "commercial_verdict": "string",
    "overall_film_rating": float (1.0 - 10.0),
    "commercial_tier": "string",
    "key_thesis": "string"
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
    "primary_commercial_drivers": ["string", "string", ...],
    "key_risk_factors": ["string", "string", ...],
    "target_demographics": ["string", "string", ...],
    "franchise_and_ancillary_potential": "string"
  },
  "creative_technical_assessment": {
    "key_strengths": ["string", "string", ...],
    "key_weaknesses": ["string", "string", ...],
    "thematic_and_narrative_cohesion": "string"
  },
  "strategic_recommendations": {
    "post_production_guidance": ["string", "string", ...],
    "marketing_and_positioning": ["string", "string", ...],
    "theatrical_vs_streaming_recommendation": "string"
  },
  "key_scene_highlights": [
    {
      "timestamp_range": "string",
      "shot_type": "string",
      "visual_significance": "string",
      "narrative_impact": "string"
    }
  ]
}
"""


class GroqFilmAnalyzer:
    """
    Interfaces with Groq LLM to generate validated Film Intelligence Reports.
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
        Synthesizes multimodal evidence into a validated FinalFilmIntelligenceReport.
        """
        report_id = f"FILMYAI-RPT-{uuid.uuid4().hex[:8].upper()}"
        client = self._get_client()

        candidate_models = [self.model, GROQ_FALLBACK_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "groq/compound-mini"]

        if client and self.api_key:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this film evidence and produce the complete JSON report according to instructions.\n\n{formatted_context}\n\n{JSON_SCHEMA_INSTRUCTION}"}
            ]

            for model_name in candidate_models:
                try:
                    print(f"[GroqFilmAnalyzer] Sending evidence to Groq LLM ({model_name})...")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=0.2,
                        max_tokens=2500,
                        response_format={"type": "json_object"}
                    )

                    raw_json = completion.choices[0].message.content.strip()
                    # Strip potential markdown fences if present
                    if raw_json.startswith("```"):
                        raw_json = re.sub(r'^```(?:json)?\s*', '', raw_json)
                        raw_json = re.sub(r'\s*```$', '', raw_json)

                    parsed_data = json.loads(raw_json)
                    return self._build_report_from_parsed(report_id, evidence, parsed_data)

                except Exception as e:
                    print(f"[GroqFilmAnalyzer] Model {model_name} attempt encountered error: {e}")

        # Deterministic fallback synthesis engine if Groq unavailable or errored
        print("[GroqFilmAnalyzer] Utilizing deterministic synthesis engine.")
        return self._build_fallback_report(report_id, evidence)

    def _build_report_from_parsed(
        self,
        report_id: str,
        evidence: NormalizedEvidence,
        data: Dict[str, Any]
    ) -> FinalFilmIntelligenceReport:
        """Constructs and validates the Pydantic report object."""
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

        # Safe parsing of sub-objects
        exec_data = data.get("executive_summary", {})
        exec_summary = ExecutiveSummary(
            film_title=exec_data.get("film_title", evidence.title),
            logline=exec_data.get("logline", evidence.story_evidence.summary_content[:200]),
            commercial_verdict=exec_data.get("commercial_verdict", f"Predicted Class: {evidence.commercial_evidence.predicted_commercial_class}"),
            overall_film_rating=float(exec_data.get("overall_film_rating", min(9.5, max(4.0, evidence.commercial_evidence.predicted_commercial_score + 1.0)))),
            commercial_tier=exec_data.get("commercial_tier", "Mid-to-High Market Tier"),
            key_thesis=exec_data.get("key_thesis", "Integrated film analysis combining commercial forecasting and cinematography intelligence.")
        )

        cin_data = data.get("cinematography_analysis", {})
        cin_analysis = CinematographyAnalysis(
            visual_style_overview=cin_data.get("visual_style_overview", f"Predominantly {evidence.video_evidence.predominant_shot_scale} shot composition with {evidence.video_evidence.predominant_lighting_style} lighting."),
            shot_composition_assessment=cin_data.get("shot_composition_assessment", "Balanced framing adhering to classical cinematic geometry."),
            lighting_and_atmosphere=cin_data.get("lighting_and_atmosphere", f"Atmospheric {evidence.video_evidence.predominant_lighting_style} profile with defined tonal range."),
            pacing_and_editing_rhythm=cin_data.get("pacing_and_editing_rhythm", f"{evidence.video_evidence.pacing_rhythm} with an average shot length of {evidence.video_evidence.average_shot_length_sec:.1f} seconds."),
            soundscape_and_speech=cin_data.get("soundscape_and_speech", f"Acoustic classification indicates {evidence.video_evidence.audio_speech_activity}.")
        )

        comm_data = data.get("commercial_analysis", {})
        comm_analysis = CommercialAnalysis(
            box_office_outlook=comm_data.get("box_office_outlook", f"Model assigns {evidence.commercial_evidence.commercial_success_probability*100:.1f}% hit probability with commercial score {evidence.commercial_evidence.predicted_commercial_score:.2f}/9.0."),
            primary_commercial_drivers=comm_data.get("primary_commercial_drivers", [f.factor for f in evidence.commercial_evidence.important_contributing_factors] or ["Director credibility", "Genre market demand"]),
            key_risk_factors=comm_data.get("key_risk_factors", ["Audience saturation in release window", "Budget-to-screen value alignment"]),
            target_demographics=comm_data.get("target_demographics", ["Core Cinema Goers (18-35)", "Genre Enthusiasts"]),
            franchise_and_ancillary_potential=comm_data.get("franchise_and_ancillary_potential", "Viable for streaming licensing and international catalog expansion.")
        )

        creat_data = data.get("creative_technical_assessment", {})
        creat_assess = CreativeTechnicalAssessment(
            key_strengths=creat_data.get("key_strengths", ["Solid cinematographic execution", "Clear pacing architecture"]),
            key_weaknesses=creat_data.get("key_weaknesses", ["Pacing balance across transitions", "Marketing narrative differentiation"]),
            thematic_and_narrative_cohesion=creat_data.get("thematic_and_narrative_cohesion", "Consistent tonal and narrative direction aligning with genre standards.")
        )

        strat_data = data.get("strategic_recommendations", {})
        strat_recs = StrategicRecommendations(
            post_production_guidance=strat_data.get("post_production_guidance", ["Optimize color grade contrast", "Tighten second-act transition cuts"]),
            marketing_and_positioning=strat_data.get("marketing_and_positioning", ["Highlight high-kinetic visual sequences in teaser trailers", "Leverage key talent demographics"]),
            theatrical_vs_streaming_recommendation=strat_data.get("theatrical_vs_streaming_recommendation", "Hybrid theatrical window followed by premium SVOD streaming release.")
        )

        highlights = []
        for h in data.get("key_scene_highlights", []):
            highlights.append(SceneKeyHighlight(
                timestamp_range=h.get("timestamp_range", "00:00 - 00:05"),
                shot_type=h.get("shot_type", "Medium Shot"),
                visual_significance=h.get("visual_significance", "Key visual moment"),
                narrative_impact=h.get("narrative_impact", "Narrative inflection point")
            ))

        # Fallback highlights from top_shots if empty
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
            raw_video_metrics=evidence.video_evidence.model_dump()
        )

    def _build_fallback_report(self, report_id: str, evidence: NormalizedEvidence) -> FinalFilmIntelligenceReport:
        """Deterministic high-quality synthesis when LLM is offline."""
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

        data = {
            "executive_summary": {
                "film_title": evidence.title,
                "logline": story.summary_content[:200] if story.summary_content else f"An ambitious {evidence.genre} project directed by {evidence.director}.",
                "commercial_verdict": verdict,
                "overall_film_rating": round(rating, 1),
                "commercial_tier": f"Commercial Tier: {comm.predicted_commercial_class}",
                "key_thesis": f"'{evidence.title}' combines a calculated {comm.commercial_success_probability*100:.1f}% commercial success probability with {vid.pacing_rhythm.lower()} visual architecture."
            },
            "cinematography_analysis": {
                "visual_style_overview": f"The visual palette demonstrates predominant use of {vid.predominant_shot_scale} shot framing paired with {vid.predominant_lighting_style} lighting schemes.",
                "shot_composition_assessment": f"Framing distribution exhibits structured composition across {vid.total_shots} evaluated shots.",
                "lighting_and_atmosphere": f"Lighting design centers on {vid.predominant_lighting_style} profiles, creating cinematic depth.",
                "pacing_and_editing_rhythm": f"{vid.pacing_rhythm} with an average shot length of {vid.average_shot_length_sec:.2f}s ({vid.cuts_per_minute:.1f} cuts per minute).",
                "soundscape_and_speech": f"Acoustic classification indicates: {vid.audio_speech_activity}."
            },
            "commercial_analysis": {
                "box_office_outlook": f"Commercial ML engine models a predicted score of {comm.predicted_commercial_score:.2f}/9.0 with confidence of {comm.model_confidence*100:.1f}%.",
                "primary_commercial_drivers": drivers,
                "key_risk_factors": ["Marketing reach in crowded theatrical release corridors", "Cross-demographic conversion efficiency"],
                "target_demographics": ["Core Cinema Audience (18-34)", f"{evidence.genre} Enthusiasts", "Holiday / Festive Theatergoers" if evidence.release_month in [10, 11, 12] else "General Theatergoers"],
                "franchise_and_ancillary_potential": "Strong potential for secondary SVOD licensing, cable broadcast syndication, and international distribution."
            },
            "creative_technical_assessment": {
                "key_strengths": ["Clear visual identity and disciplined shot framing", "Consistent pacing dynamics matching genre expectations"],
                "key_weaknesses": ["Lighting variation across rapid cuts", "Audience retention over dialogue-heavy sequences"],
                "thematic_and_narrative_cohesion": "Cohesive thematic tone established throughout the visual and narrative framework."
            },
            "strategic_recommendations": {
                "post_production_guidance": ["Ensure tonal color grading uniformity across shot scale shifts", "Fine-tune dialogue-to-ambient sound mixing"],
                "marketing_and_positioning": ["Center campaign on core star power and high-impact keyframe moments", "Time promotional drops 6-8 weeks prior to release month"],
                "theatrical_vs_streaming_recommendation": "Wide theatrical rollout with strategic 45-day window before premiering on major SVOD platforms."
            },
            "key_scene_highlights": [h.model_dump() for h in highlights]
        }

        return self._build_report_from_parsed(report_id, evidence, data)
