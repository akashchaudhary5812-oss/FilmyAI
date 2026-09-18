"""
Report Chunking Engine for FilmyAI.
Converts structured FinalFilmIntelligenceReport objects into rich, searchable,
metadata-tagged ReportChunk items while preserving all 17 sections, metrics,
timestamps, and recommendations.
"""
from typing import List, Dict, Any, Union
from datetime import datetime, timezone
import hashlib

from RAG.schemas.chunk_schema import ReportChunk


class ReportChunker:
    """
    Splits a structured FilmyAI Final Film Intelligence Report into semantically
    meaningful chunks aligned with standard report sections.
    """

    @classmethod
    def chunk_report(
        cls,
        film_id: str,
        report_id: str,
        report_data: Union[Dict[str, Any], Any]
    ) -> List[ReportChunk]:
        """
        Extracts structured sections from a report dict or Pydantic model
        and produces a list of ReportChunk objects.
        """
        # Convert Pydantic model to dict if needed
        if hasattr(report_data, "model_dump"):
            data = report_data.model_dump()
        elif hasattr(report_data, "dict"):
            data = report_data.dict()
        elif isinstance(report_data, dict):
            data = report_data
        else:
            data = dict(report_data)

        film_name = data.get("film_title") or data.get("film_name") or "Unknown Film"
        created_at = data.get("generated_at_utc") or datetime.now(timezone.utc).isoformat()
        chunks: List[ReportChunk] = []

        chunk_idx = 0
        def make_chunk(
            section: str,
            subsection: str,
            content: str,
            metrics: Dict[str, Any] = None,
            timestamps: List[str] = None,
            severity: str = None,
            confidence: float = None,
            priority: str = None
        ) -> ReportChunk:
            nonlocal chunk_idx
            cid = f"{film_id}_{section.lower().replace(' ', '_')}_{chunk_idx}"
            chunk_idx += 1
            return ReportChunk(
                chunk_id=cid,
                film_id=str(film_id),
                film_name=str(film_name),
                report_id=str(report_id),
                report_version="1.0",
                section=section,
                subsection=subsection,
                source_type="final_report",
                content=content.strip(),
                structured_metrics=metrics or {},
                timestamps=timestamps or [],
                severity=severity,
                confidence=confidence,
                recommendation_priority=priority,
                created_at_utc=created_at
            )

        # ----------------------------------------------------
        # 1. Metadata & Story Provenance
        # ----------------------------------------------------
        meta = data.get("metadata_summary", {})
        provenance = data.get("story_provenance", {})
        meta_lines = [f"Film Title: {film_name}"]
        if meta.get("director"):
            meta_lines.append(f"Director: {meta.get('director')}")
        if meta.get("casting"):
            casting_str = ", ".join(meta.get("casting")) if isinstance(meta.get("casting"), list) else str(meta.get("casting"))
            meta_lines.append(f"Casting / Actors: {casting_str}")
        if meta.get("genre"):
            meta_lines.append(f"Genre: {meta.get('genre')}")
        if meta.get("budget"):
            meta_lines.append(f"Budget: ${meta.get('budget'):,}" if isinstance(meta.get("budget"), (int, float)) else f"Budget: {meta.get('budget')}")
        if provenance:
            prov_str = ", ".join([f"{k}: {v}" for k, v in provenance.items()])
            meta_lines.append(f"Story Provenance: {prov_str}")
        
        chunks.append(make_chunk(
            section="Film Overview",
            subsection="Metadata & Provenance",
            content="\n".join(meta_lines),
            metrics=meta
        ))

        # ----------------------------------------------------
        # 2. Executive Summary
        # ----------------------------------------------------
        exec_sum = data.get("executive_summary", {})
        if exec_sum:
            exec_lines = [
                f"Film Title: {exec_sum.get('film_title', film_name)}",
                f"Logline: {exec_sum.get('logline', 'N/A')}",
                f"Commercial Verdict: {exec_sum.get('commercial_verdict', 'N/A')}",
                f"Overall Rating: {exec_sum.get('overall_film_rating', 'N/A')}/10.0",
                f"Commercial Tier: {exec_sum.get('commercial_tier', 'N/A')}",
                f"Executive Thesis: {exec_sum.get('key_thesis', 'N/A')}"
            ]
            chunks.append(make_chunk(
                section="Executive Summary",
                subsection="Synthesis & Overall Verdict",
                content="\n".join(exec_lines),
                metrics={
                    "overall_film_rating": exec_sum.get("overall_film_rating"),
                    "commercial_verdict": exec_sum.get("commercial_verdict"),
                    "commercial_tier": exec_sum.get("commercial_tier")
                }
            ))

        # ----------------------------------------------------
        # 3. Cinematography Analysis
        # ----------------------------------------------------
        cinema = data.get("cinematography_analysis", {})
        if cinema:
            if cinema.get("visual_style_overview"):
                chunks.append(make_chunk(
                    section="Cinematography",
                    subsection="Visual Style Overview",
                    content=f"Visual Style Overview for '{film_name}':\n{cinema.get('visual_style_overview')}"
                ))
            if cinema.get("shot_composition_assessment"):
                chunks.append(make_chunk(
                    section="Cinematography",
                    subsection="Shot Composition & Framing",
                    content=f"Shot Composition Assessment:\n{cinema.get('shot_composition_assessment')}"
                ))
            if cinema.get("lighting_and_atmosphere"):
                chunks.append(make_chunk(
                    section="Cinematography",
                    subsection="Lighting & Atmosphere",
                    content=f"Lighting and Atmosphere Analysis:\n{cinema.get('lighting_and_atmosphere')}"
                ))
            if cinema.get("pacing_and_editing_rhythm"):
                chunks.append(make_chunk(
                    section="Cinematography",
                    subsection="Pacing & Editing Rhythm",
                    content=f"Pacing and Editing Rhythm:\n{cinema.get('pacing_and_editing_rhythm')}"
                ))
            if cinema.get("soundscape_and_speech"):
                chunks.append(make_chunk(
                    section="Cinematography",
                    subsection="Soundscape & Audio Analysis",
                    content=f"Soundscape and Speech Dynamics:\n{cinema.get('soundscape_and_speech')}"
                ))

        # ----------------------------------------------------
        # 4. Commercial Analysis & Box Office Outlook
        # ----------------------------------------------------
        comm = data.get("commercial_analysis", {})
        if comm:
            if comm.get("box_office_outlook"):
                chunks.append(make_chunk(
                    section="Commercial Analysis",
                    subsection="Box Office Outlook",
                    content=f"Box Office Outlook for '{film_name}':\n{comm.get('box_office_outlook')}"
                ))
            if comm.get("primary_commercial_drivers"):
                drivers = comm.get("primary_commercial_drivers", [])
                drivers_text = "\n".join([f"- {d}" for d in drivers]) if isinstance(drivers, list) else str(drivers)
                chunks.append(make_chunk(
                    section="Commercial Analysis",
                    subsection="Primary Commercial Drivers",
                    content=f"Key Commercial Revenue & Appeal Drivers:\n{drivers_text}"
                ))
            if comm.get("key_risk_factors"):
                risks = comm.get("key_risk_factors", [])
                risks_text = "\n".join([f"- {r}" for r in risks]) if isinstance(risks, list) else str(risks)
                chunks.append(make_chunk(
                    section="Commercial Analysis",
                    subsection="Key Commercial Risk Factors",
                    content=f"Commercial and Market Risk Factors:\n{risks_text}",
                    severity="high"
                ))
            if comm.get("target_demographics"):
                demos = comm.get("target_demographics", [])
                demos_text = "\n".join([f"- {dm}" for dm in demos]) if isinstance(demos, list) else str(demos)
                chunks.append(make_chunk(
                    section="Commercial Analysis",
                    subsection="Target Demographics",
                    content=f"Target Audience Demographics:\n{demos_text}"
                ))
            if comm.get("franchise_and_ancillary_potential"):
                chunks.append(make_chunk(
                    section="Commercial Analysis",
                    subsection="Franchise & Ancillary Potential",
                    content=f"Franchise, Streaming & Ancillary Revenue Potential:\n{comm.get('franchise_and_ancillary_potential')}"
                ))

        # ----------------------------------------------------
        # 5. Creative & Technical Assessment (Strengths & Weaknesses)
        # ----------------------------------------------------
        creative = data.get("creative_technical_assessment", {})
        if creative:
            if creative.get("key_strengths"):
                strengths = creative.get("key_strengths", [])
                str_text = "\n".join([f"- {s}" for s in strengths]) if isinstance(strengths, list) else str(strengths)
                chunks.append(make_chunk(
                    section="Creative Assessment",
                    subsection="Key Strengths",
                    content=f"Top Creative & Technical Strengths of '{film_name}':\n{str_text}"
                ))
            if creative.get("key_weaknesses"):
                weaknesses = creative.get("key_weaknesses", [])
                wk_text = "\n".join([f"- {w}" for w in weaknesses]) if isinstance(weaknesses, list) else str(weaknesses)
                chunks.append(make_chunk(
                    section="Creative Assessment",
                    subsection="Key Weaknesses & Areas for Improvement",
                    content=f"Creative & Technical Weaknesses / Critical Risks:\n{wk_text}",
                    severity="high"
                ))
            if creative.get("thematic_and_narrative_cohesion"):
                chunks.append(make_chunk(
                    section="Story & Screenplay",
                    subsection="Narrative Cohesion & Story Logic",
                    content=f"Thematic and Narrative Cohesion Evaluation:\n{creative.get('thematic_and_narrative_cohesion')}"
                ))

        # ----------------------------------------------------
        # 6. Strategic Recommendations
        # ----------------------------------------------------
        strat = data.get("strategic_recommendations", {})
        if strat:
            if strat.get("post_production_guidance"):
                guidance = strat.get("post_production_guidance", [])
                g_text = "\n".join([f"- {g}" for g in guidance]) if isinstance(guidance, list) else str(guidance)
                chunks.append(make_chunk(
                    section="Strategic Recommendations",
                    subsection="Post-Production Guidance",
                    content=f"Post-Production, Editing & Color Guidance:\n{g_text}",
                    priority="high"
                ))
            if strat.get("marketing_and_positioning"):
                mktg = strat.get("marketing_and_positioning", [])
                m_text = "\n".join([f"- {m}" for m in mktg]) if isinstance(mktg, list) else str(mktg)
                chunks.append(make_chunk(
                    section="Strategic Recommendations",
                    subsection="Marketing & Positioning Strategy",
                    content=f"Marketing, Trailer & Festival Positioning:\n{m_text}",
                    priority="medium"
                ))
            if strat.get("theatrical_vs_streaming_recommendation"):
                chunks.append(make_chunk(
                    section="Strategic Recommendations",
                    subsection="Distribution & Release Strategy",
                    content=f"Theatrical vs Streaming Release Strategy:\n{strat.get('theatrical_vs_streaming_recommendation')}",
                    priority="high"
                ))

        # ----------------------------------------------------
        # 7. Key Scene Highlights
        # ----------------------------------------------------
        highlights = data.get("key_scene_highlights", [])
        if highlights and isinstance(highlights, list):
            scene_lines = []
            all_timestamps = []
            for h in highlights:
                t_range = h.get("timestamp_range", "N/A")
                shot = h.get("shot_type", "Scene")
                vis = h.get("visual_significance", "")
                narr = h.get("narrative_impact", "")
                all_timestamps.append(t_range)
                scene_lines.append(f"• Timestamp {t_range} ({shot}): Visual: {vis} | Narrative Impact: {narr}")
            
            chunks.append(make_chunk(
                section="Cinematography",
                subsection="Key Scene Highlights & Timestamps",
                content=f"Scene-by-Scene Visual Highlights:\n" + "\n".join(scene_lines),
                timestamps=all_timestamps
            ))

        # ----------------------------------------------------
        # 8. Raw ML Predictions & Signals
        # ----------------------------------------------------
        raw_ml = data.get("raw_ml_predictions", {})
        if raw_ml:
            ml_lines = [
                f"Predicted Commercial Class: {raw_ml.get('predicted_commercial_class', 'N/A')}",
                f"Commercial Score: {raw_ml.get('predicted_commercial_score', 'N/A')}",
                f"Success Probability: {raw_ml.get('commercial_success_probability', 'N/A')}",
                f"Model Confidence: {raw_ml.get('model_confidence', 'N/A')}"
            ]
            factors = raw_ml.get("important_contributing_factors", [])
            if factors:
                factor_strs = [f"{f.get('factor')}: {f.get('impact')}" for f in factors if isinstance(f, dict)]
                ml_lines.append(f"Contributing ML Factors: {', '.join(factor_strs)}")
            
            chunks.append(make_chunk(
                section="Commercial Analysis",
                subsection="ML Prediction Details & Contributing Factors",
                content=f"Commercial Machine Learning Model Predictions:\n" + "\n".join(ml_lines),
                metrics=raw_ml,
                confidence=raw_ml.get("model_confidence")
            ))

        # ----------------------------------------------------
        # 9. Raw Video Metrics (if available)
        # ----------------------------------------------------
        raw_video = data.get("raw_video_metrics", {})
        if raw_video and raw_video.get("status") == "completed":
            vid_lines = [
                f"Total Video Shots: {raw_video.get('total_shots', 'N/A')}",
                f"Pacing & Rhythm: {raw_video.get('pacing_rhythm', 'N/A')}",
                f"FPS: {raw_video.get('fps', 'N/A')}",
                f"Duration: {raw_video.get('duration_seconds', 'N/A')}s",
                f"Audio RMS Level: {raw_video.get('audio_rms_level', 'N/A')}"
            ]
            chunks.append(make_chunk(
                section="Cinematography",
                subsection="Video Engine Metrics",
                content=f"Multimodal Video Signal Measurements:\n" + "\n".join(vid_lines),
                metrics=raw_video
            ))

        return chunks
