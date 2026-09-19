"""
PDF Report Builder for FILMY AI v3.0.
Generates an executive-level, multi-page studio intelligence PDF report using ReportLab.
v3.0: Full render of Cast Performance Scorecards, Dynamic High/Medium/Low Points,
Scene Performance Timeline, Character Emotional Journey, Pacing & Rhythm Map,
and Technical & Creative Peaks.
"""
from pathlib import Path
from typing import Optional, List, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.lib import colors

from LLM_FINAL_REPORT.schemas.report_schema import (
    FinalFilmIntelligenceReport,
    CastPerformanceAnalysis,
    FilmHighPoint,
    FilmMediumPoint,
    FilmLowPoint,
    ScenePerformanceTimeline,
    CharacterEmotionalJourney,
    PacingRhythmMap,
    TechnicalCreativePeak,
)
from LLM_FINAL_REPORT.pdf_generator.styles import (
    get_report_styles,
    NumberedCanvas,
    PRIMARY_DARK,
    ACCENT_GOLD,
    ACCENT_TEAL,
    ACCENT_RED,
    BG_LIGHT,
    CARD_BG,
    TEXT_MAIN,
    TEXT_MUTED,
    BORDER_COLOR,
    BADGE_BG_USER,
    BADGE_TXT_USER,
    BADGE_BG_AI,
    BADGE_TXT_AI
)

HIGH_COLOR = colors.HexColor("#DCFCE7")
HIGH_BORDER = colors.HexColor("#166534")
MEDIUM_COLOR = colors.HexColor("#FEF3C7")
MEDIUM_BORDER = colors.HexColor("#92400E")
LOW_COLOR = colors.HexColor("#FEE2E2")
LOW_BORDER = colors.HexColor("#991B1B")


def _fmt_score(val: Any, suffix: str = "/10") -> str:
    if val is None:
        return "—"
    try:
        return f"{float(val):.1f}{suffix}"
    except (TypeError, ValueError):
        return "—"


def _fmt_conf(conf: str) -> str:
    mapping = {"HIGH": "●●●", "MEDIUM": "●●○", "LOW": "●○○"}
    return mapping.get(conf, "○○○")


class FilmReportPDFBuilder:
    """
    Builds studio-grade PDF reports from a FinalFilmIntelligenceReport instance v3.0.
    """
    def __init__(self, output_path: str):
        self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self.styles = get_report_styles()

    def build(self, report: FinalFilmIntelligenceReport) -> str:
        """Executes document rendering and saves to output_path."""
        doc = SimpleDocTemplate(
            str(self.output_path),
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        story = []
        meta = report.metadata_summary
        exec_s = report.executive_summary
        comm = report.commercial_analysis
        cin = report.cinematography_analysis
        creat = report.creative_technical_assessment
        strat = report.strategic_recommendations
        prov = report.story_provenance

        # ==========================================
        # 1. HEADER & FILM IDENTIFICATION
        # ==========================================
        story.append(Paragraph("<b>FILMY AI</b> &bull; STUDIO FILM INTELLIGENCE REPORT v3.0", self.styles["FilmSubHeader"]))
        story.append(Paragraph(report.film_title.upper(), self.styles["FilmTitleHeader"]))

        cast_str = ", ".join(meta.get("actors", [])[:4]) if meta.get("actors") else "Ensemble Cast"
        budget_str = f"${meta.get('budget', 0):,.0f}" if meta.get("budget", 0) > 0 else "Confidential / Ind."
        meta_info = (
            f"<b>Director:</b> {meta.get('director', 'N/A')} &nbsp;|&nbsp; "
            f"<b>Genre:</b> {meta.get('genre', 'Drama')} &nbsp;|&nbsp; "
            f"<b>Budget:</b> {budget_str} &nbsp;|&nbsp; "
            f"<b>Release:</b> {meta.get('release_month', 6):02d}/{meta.get('release_year', 2025)} "
            f"({'Sequel' if meta.get('is_sequel') else 'Original Standalone'})"
        )
        story.append(Paragraph(meta_info, self.styles["TableCell"]))
        story.append(Paragraph(f"<b>Cast:</b> {cast_str}", self.styles["TableCell"]))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=12))

        # ==========================================
        # 2. EXECUTIVE SCORECARD BANNER
        # ==========================================
        raw_comm = report.raw_ml_predictions
        score_val = f"{raw_comm.get('predicted_commercial_score', exec_s.overall_film_rating):.1f} / 9.0"
        prob_val = f"{raw_comm.get('commercial_success_probability', 0.5) * 100:.0f}%"
        conf_val = f"{raw_comm.get('model_confidence', 0.5) * 100:.0f}%"
        verdict_val = raw_comm.get("predicted_commercial_class", "Average").upper()

        score_data = [
            [Paragraph("COMMERCIAL VERDICT", self.styles["ScorecardLabel"]),
             Paragraph("COMMERCIAL SCORE", self.styles["ScorecardLabel"]),
             Paragraph("HIT PROBABILITY", self.styles["ScorecardLabel"]),
             Paragraph("MODEL CONFIDENCE", self.styles["ScorecardLabel"]),
             Paragraph("OVERALL RATING", self.styles["ScorecardLabel"]),
             Paragraph("HIGH POINTS", self.styles["ScorecardLabel"]),
             Paragraph("LOW POINTS", self.styles["ScorecardLabel"])],
            [Paragraph(f"<font color='{ACCENT_GOLD.hexval()}'><b>{verdict_val}</b></font>", self.styles["ScorecardValue"]),
             Paragraph(score_val, self.styles["ScorecardValue"]),
             Paragraph(prob_val, self.styles["ScorecardValue"]),
             Paragraph(conf_val, self.styles["ScorecardValue"]),
             Paragraph(f"{exec_s.overall_film_rating:.1f}/10", self.styles["ScorecardValue"]),
             Paragraph(str(report.high_point_count), self.styles["ScorecardValue"]),
             Paragraph(str(report.low_point_count), self.styles["ScorecardValue"])],
        ]
        score_table = Table(score_data, colWidths=[96, 74, 74, 80, 75, 60, 60])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(score_table)
        story.append(Spacer(1, 14))

        # ==========================================
        # 3. EXECUTIVE SUMMARY & FILM THESIS
        # ==========================================
        story.append(Paragraph("1. EXECUTIVE SUMMARY & FILM THESIS", self.styles["SectionHeader"]))
        story.append(Paragraph(f"<b>Logline:</b> {exec_s.logline}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Market Verdict:</b> {exec_s.commercial_verdict} ({exec_s.commercial_tier})", self.styles["ExecutiveBodyBold"]))
        story.append(Paragraph(exec_s.key_thesis, self.styles["ExecutiveBody"]))
        if exec_s.strongest_creative_areas:
            story.append(Paragraph(f"<b>Strongest Creative Areas:</b> {', '.join(exec_s.strongest_creative_areas)}", self.styles["ExecutiveBody"]))
        if exec_s.weakest_creative_areas:
            story.append(Paragraph(f"<b>Areas Requiring Improvement:</b> {', '.join(exec_s.weakest_creative_areas)}", self.styles["ExecutiveBody"]))
        if exec_s.confidence_limitations:
            story.append(Paragraph(f"<i>Limitations: {exec_s.confidence_limitations}</i>", self.styles["SmallMuted"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 4. STORY & SCREENPLAY
        # ==========================================
        story.append(Paragraph("2. STORY & SCREENPLAY CONTEXT", self.styles["SectionHeader"]))
        script_src = prov.get("script_source", "AI_GENERATED")
        sum_src = prov.get("summary_source", "AI_GENERATED")
        mode = prov.get("case_mode", "CASE_1")
        script_badge = f"<font color='{BADGE_TXT_USER.hexval()}'>[USER PROVIDED]</font>" if script_src == "USER_PROVIDED" else f"<font color='{BADGE_TXT_AI.hexval()}'>[AI GENERATED FROM VIDEO]</font>"
        sum_badge = f"<font color='{BADGE_TXT_USER.hexval()}'>[USER PROVIDED]</font>" if sum_src == "USER_PROVIDED" else f"<font color='{BADGE_TXT_AI.hexval()}'>[AI GENERATED FROM VIDEO]</font>"
        prov_table = Table([
            [Paragraph(f"<b>Script Source:</b> {script_badge}", self.styles["TableCell"]),
             Paragraph(f"<b>Summary Source:</b> {sum_badge}", self.styles["TableCell"]),
             Paragraph(f"<b>Mode:</b> {mode}", self.styles["TableCell"])]
        ], colWidths=[180, 180, 144])
        prov_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(prov_table)
        story.append(Spacer(1, 6))
        story.append(Paragraph(creat.thematic_and_narrative_cohesion, self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 5. COMMERCIAL ANALYSIS
        # ==========================================
        story.append(Paragraph("3. COMMERCIAL & BOX OFFICE INTELLIGENCE", self.styles["SectionHeader"]))
        story.append(Paragraph(comm.box_office_outlook, self.styles["ExecutiveBody"]))
        story.append(Paragraph("Key Commercial Catalysts:", self.styles["SubSectionHeader"]))
        for driver in comm.primary_commercial_drivers:
            story.append(Paragraph(f"&bull; {driver}", self.styles["BulletText"]))
        story.append(Paragraph("Risk Factors:", self.styles["SubSectionHeader"]))
        for risk in comm.key_risk_factors:
            story.append(Paragraph(f"&bull; {risk}", self.styles["BulletText"]))
        story.append(Paragraph(f"<b>Target Demographic:</b> {', '.join(comm.target_demographics)}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Franchise & Ancillary:</b> {comm.franchise_and_ancillary_potential}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 6. CINEMATOGRAPHY
        # ==========================================
        raw_vid = report.raw_video_metrics
        story.append(Paragraph("4. MULTIMODAL CINEMATOGRAPHY & VIDEO INTELLIGENCE", self.styles["SectionHeader"]))
        story.append(Paragraph(cin.visual_style_overview, self.styles["ExecutiveBody"]))
        dur_val = f"{raw_vid.get('duration_seconds', 0):.1f}s"
        shots_val = str(raw_vid.get('total_shots', 0))
        pacing_val = raw_vid.get('pacing_rhythm', 'Moderate')
        lighting_val = raw_vid.get('predominant_lighting_style', 'N/A')
        speech_val = raw_vid.get('audio_speech_activity', 'N/A')
        vid_data = [
            [Paragraph("<b>Duration</b>", self.styles["TableHead"]),
             Paragraph("<b>Total Shots</b>", self.styles["TableHead"]),
             Paragraph("<b>Pacing Rhythm</b>", self.styles["TableHead"]),
             Paragraph("<b>Predominant Lighting</b>", self.styles["TableHead"]),
             Paragraph("<b>Acoustic Mode</b>", self.styles["TableHead"])],
            [Paragraph(dur_val, self.styles["TableCell"]),
             Paragraph(shots_val, self.styles["TableCell"]),
             Paragraph(pacing_val, self.styles["TableCell"]),
             Paragraph(lighting_val, self.styles["TableCell"]),
             Paragraph(speech_val, self.styles["TableCell"])]
        ]
        vid_table = Table(vid_data, colWidths=[80, 70, 140, 110, 104])
        vid_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(vid_table)
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Composition:</b> {cin.shot_composition_assessment}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Lighting:</b> {cin.lighting_and_atmosphere}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Editing & Rhythm:</b> {cin.pacing_and_editing_rhythm}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Soundscape:</b> {cin.soundscape_and_speech}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 7. CAST PERFORMANCE ANALYSIS (v3.0)
        # ==========================================
        if report.cast_performance and report.cast_performance.cast_items:
            story.extend(self._render_cast_performance(report.cast_performance))

        # ==========================================
        # 8. SCENE PERFORMANCE TIMELINE (v3.0)
        # ==========================================
        if report.scene_performance_timeline and report.scene_performance_timeline.entries:
            story.extend(self._render_scene_timeline(report.scene_performance_timeline))

        # ==========================================
        # 9. FILM HIGH POINTS (v3.0)
        # ==========================================
        if report.film_high_points:
            story.extend(self._render_film_points(
                "FILM HIGH POINTS",
                report.film_high_points,
                HIGH_COLOR, HIGH_BORDER,
                f"<font color='#{HIGH_BORDER.hexval()}'><b>HIGH PERFORMANCE SCENE</b></font>"
            ))

        # ==========================================
        # 10. FILM MEDIUM POINTS (v3.0)
        # ==========================================
        if report.film_medium_points:
            story.extend(self._render_medium_points(report.film_medium_points))

        # ==========================================
        # 11. FILM LOW POINTS (v3.0)
        # ==========================================
        if report.film_low_points:
            story.extend(self._render_film_low_points(report.film_low_points))

        # ==========================================
        # 12. CHARACTER & EMOTIONAL JOURNEY (v3.0)
        # ==========================================
        if report.character_emotional_journey and report.character_emotional_journey.characters:
            story.extend(self._render_character_journey(report.character_emotional_journey))

        # ==========================================
        # 13. PACING & RHYTHM MAP (v3.0)
        # ==========================================
        if report.pacing_rhythm_map:
            story.extend(self._render_pacing_map(report.pacing_rhythm_map))

        # ==========================================
        # 14. TECHNICAL & CREATIVE PEAKS (v3.0)
        # ==========================================
        if report.technical_creative_peaks:
            story.extend(self._render_technical_peaks(report.technical_creative_peaks))

        # ==========================================
        # 15. CREATIVE & TECHNICAL SWOT
        # ==========================================
        story.append(Paragraph("15. CREATIVE & TECHNICAL EVALUATION", self.styles["SectionHeader"]))
        story.append(Paragraph("Strengths:", self.styles["SubSectionHeader"]))
        for strength in creat.key_strengths:
            story.append(Paragraph(f"<font color='{ACCENT_TEAL.hexval()}'>&check;</font> {strength}", self.styles["BulletText"]))
        story.append(Paragraph("Weaknesses:", self.styles["SubSectionHeader"]))
        for weak in creat.key_weaknesses:
            story.append(Paragraph(f"<font color='{ACCENT_RED.hexval()}'>&times;</font> {weak}", self.styles["BulletText"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 16. STRATEGIC RECOMMENDATIONS
        # ==========================================
        story.append(Paragraph("16. STRATEGIC STUDIO RECOMMENDATIONS", self.styles["SectionHeader"]))
        story.append(Paragraph("Post-Production:", self.styles["SubSectionHeader"]))
        for rec in strat.post_production_guidance:
            story.append(Paragraph(f"&bull; {rec}", self.styles["BulletText"]))
        story.append(Paragraph("Marketing & Positioning:", self.styles["SubSectionHeader"]))
        for mkt in strat.marketing_and_positioning:
            story.append(Paragraph(f"&bull; {mkt}", self.styles["BulletText"]))
        story.append(Paragraph(f"<b>Distribution:</b> {strat.theatrical_vs_streaming_recommendation}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 17. KEY SCENE HIGHLIGHTS
        # ==========================================
        if report.key_scene_highlights:
            story.append(Paragraph("17. KEY SEQUENCE & SHOT HIGHLIGHTS", self.styles["SectionHeader"]))
            hl_data = [[
                Paragraph("<b>Timestamp</b>", self.styles["TableHead"]),
                Paragraph("<b>Shot Scale</b>", self.styles["TableHead"]),
                Paragraph("<b>Visual Significance</b>", self.styles["TableHead"]),
                Paragraph("<b>Narrative Impact</b>", self.styles["TableHead"])
            ]]
            for h in report.key_scene_highlights[:8]:
                hl_data.append([
                    Paragraph(h.timestamp_range, self.styles["TableCellBold"]),
                    Paragraph(h.shot_type, self.styles["TableCell"]),
                    Paragraph(h.visual_significance, self.styles["TableCell"]),
                    Paragraph(h.narrative_impact, self.styles["TableCell"])
                ])
            hl_table = Table(hl_data, colWidths=[74, 90, 170, 170])
            hl_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
                ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(hl_table)
            story.append(Spacer(1, 10))

        # ==========================================
        # DISCLAIMER
        # ==========================================
        disclaimer = (
            f"<i>Report ID: {report.report_id} &bull; Version: {report.report_version} &bull; "
            f"Generated: {report.generated_at_utc} &bull; "
            f"Scene Scoring: {report.scene_scoring_method or 'N/A'} &bull; "
            f"Commercial ML v{raw_comm.get('model_version', '2.0.0')} &bull; "
            f"Video Intelligence v{raw_vid.get('engine_version', '2.0.0')} &bull; FilmyAI Platform.</i>"
        )
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=6))
        story.append(Paragraph(disclaimer, self.styles["SmallMuted"]))

        doc.build(story, canvasmaker=NumberedCanvas)
        return str(self.output_path)

    # ==========================================
    # v3.0 Section Renderers
    # ==========================================

    def _render_cast_performance(self, cast: CastPerformanceAnalysis):
        elems = []
        elems.append(Paragraph("5. CAST PERFORMANCE ANALYSIS", self.styles["SectionHeader"]))
        elems.append(Paragraph(cast.overall_cast_assessment or "", self.styles["ExecutiveBody"]))
        if cast.evidence_notes:
            elems.append(Paragraph(f"<i>{cast.evidence_notes}</i>", self.styles["SmallMuted"]))
        elems.append(Spacer(1, 6))

        if not cast.cast_items:
            elems.append(Paragraph("No cast members with sufficient evidence.", self.styles["SmallMuted"]))
            return elems

        # Scorecard table header
        header = [
            Paragraph("<b>Actor</b>", self.styles["TableHead"]),
            Paragraph("<b>Role</b>", self.styles["TableHead"]),
            Paragraph("<b>Acting</b>", self.styles["TableHead"]),
            Paragraph("<b>Emotional</b>", self.styles["TableHead"]),
            Paragraph("<b>Dialogue</b>", self.styles["TableHead"]),
            Paragraph("<b>Arc</b>", self.styles["TableHead"]),
            Paragraph("<b>Overall</b>", self.styles["TableHead"]),
            Paragraph("<b>Conf.</b>", self.styles["TableHead"]),
        ]
        rows = [header]
        for ci in cast.cast_items:
            sc = ci.scores
            conf_str = _fmt_conf(ci.confidence)
            rows.append([
                Paragraph(ci.actor_name, self.styles["TableCellBold"]),
                Paragraph(ci.role_category, self.styles["TableCell"]),
                Paragraph(_fmt_score(sc.acting_score), self.styles["TableCell"]),
                Paragraph(_fmt_score(sc.emotional_connect_score), self.styles["TableCell"]),
                Paragraph(_fmt_score(sc.dialogue_delivery_score), self.styles["TableCell"]),
                Paragraph(_fmt_score(sc.character_arc_score), self.styles["TableCell"]),
                Paragraph(f"<b>{_fmt_score(ci.overall_performance_score)}</b>", self.styles["TableCellBold"]),
                Paragraph(conf_str, self.styles["TableCell"]),
            ])

        cast_table = Table(rows, colWidths=[90, 75, 52, 60, 56, 46, 56, 48])
        bg_style = [
            ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ]
        cast_table.setStyle(TableStyle(bg_style))
        elems.append(cast_table)
        elems.append(Spacer(1, 10))

        # Individual cast improvement notes
        for ci in cast.cast_items:
            if ci.improvement_notes:
                elems.append(Paragraph(
                    f"<b>{ci.actor_name}:</b> {ci.improvement_notes}",
                    self.styles["BulletText"]
                ))
        elems.append(Spacer(1, 8))
        return elems

    def _render_scene_timeline(self, timeline: ScenePerformanceTimeline):
        elems = []
        elems.append(Paragraph("6. SCENE PERFORMANCE TIMELINE", self.styles["SectionHeader"]))
        info = (
            f"Duration: {timeline.film_duration_sec:.0f}s | "
            f"Scenes Evaluated: {timeline.total_scenes_evaluated} | "
            f"Avg Score: {_fmt_score(timeline.average_scene_score)} | "
            f"Confidence: {_fmt_conf(timeline.confidence)}"
        )
        elems.append(Paragraph(info, self.styles["SmallMuted"]))
        elems.append(Spacer(1, 6))

        if not timeline.entries:
            elems.append(Paragraph("Insufficient shot data for timeline generation.", self.styles["SmallMuted"]))
            return elems

        header = [
            Paragraph("<b>Time Range</b>", self.styles["TableHead"]),
            Paragraph("<b>Score</b>", self.styles["TableHead"]),
            Paragraph("<b>Pacing</b>", self.styles["TableHead"]),
            Paragraph("<b>Shots</b>", self.styles["TableHead"]),
            Paragraph("<b>Visual Evidence</b>", self.styles["TableHead"]),
        ]
        rows = [header]
        for entry in timeline.entries[:30]:  # cap at 30 rows in PDF
            sc = entry.scene_score
            if sc is None:
                sc_str = "—"
            elif sc >= 7.0:
                sc_str = f"<font color='#166534'><b>{sc:.1f}</b></font>"
            elif sc < 5.5:
                sc_str = f"<font color='#991B1B'><b>{sc:.1f}</b></font>"
            else:
                sc_str = f"{sc:.1f}"

            rows.append([
                Paragraph(entry.timestamp_range, self.styles["TableCell"]),
                Paragraph(sc_str, self.styles["TimelineCell"]),
                Paragraph(entry.pacing_label or "—", self.styles["TableCell"]),
                Paragraph(str(entry.shot_count), self.styles["TimelineCell"]),
                Paragraph((entry.visual_evidence or "")[:60], self.styles["SmallMuted"]),
            ])

        tl_table = Table(rows, colWidths=[130, 50, 130, 40, 154])
        tl_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('ALIGN', (1, 0), (3, -1), 'CENTER'),
        ]))
        elems.append(tl_table)
        if len(timeline.entries) > 30:
            elems.append(Paragraph(f"<i>Showing 30 of {len(timeline.entries)} scenes. Full timeline in JSON report.</i>", self.styles["SmallMuted"]))
        elems.append(Spacer(1, 10))
        return elems

    def _render_film_points(self, title: str, points: list, bg_color, border_color, badge_text: str):
        elems = []
        num = "7." if "HIGH" in title else "8." if "MEDIUM" in title else "9."
        elems.append(Paragraph(f"{num} {title} ({len(points)} identified)", self.styles["SectionHeader"]))
        for pt in points:
            ts = f"{pt.timestamp_start} → {pt.timestamp_end}"
            sc_str = _fmt_score(pt.scene_score)
            conf_str = _fmt_conf(pt.confidence)
            items = [
                [Paragraph(badge_text, self.styles["SmallMuted"]),
                 Paragraph(f"<b>Timestamp:</b> {ts} &nbsp;|&nbsp; <b>Score:</b> {sc_str} &nbsp;|&nbsp; <b>Confidence:</b> {conf_str}", self.styles["TableCell"])],
                [Paragraph(f"<b>Description:</b>", self.styles["TableCellBold"]),
                 Paragraph(pt.scene_description or "—", self.styles["TableCell"])],
                [Paragraph(f"<b>Why it works:</b>", self.styles["TableCellBold"]),
                 Paragraph(pt.why_it_works or "—", self.styles["TableCell"])],
            ]
            if pt.evidence:
                ev_str = " | ".join(pt.evidence[:3])
                items.append([Paragraph("<b>Evidence:</b>", self.styles["TableCellBold"]),
                               Paragraph(ev_str, self.styles["SmallMuted"])])

            card = Table(items, colWidths=[90, 414])
            card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), bg_color),
                ('BOX', (0, 0), (-1, -1), 1, border_color),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elems.append(KeepTogether([card, Spacer(1, 6)]))
        elems.append(Spacer(1, 8))
        return elems

    def _render_medium_points(self, points: List[FilmMediumPoint]):
        elems = []
        elems.append(Paragraph(f"8. FILM MEDIUM POINTS ({len(points)} identified)", self.styles["SectionHeader"]))
        header = [
            Paragraph("<b>Timestamp</b>", self.styles["TableHead"]),
            Paragraph("<b>Score</b>", self.styles["TableHead"]),
            Paragraph("<b>What Works</b>", self.styles["TableHead"]),
            Paragraph("<b>What is Average</b>", self.styles["TableHead"]),
            Paragraph("<b>Improvement</b>", self.styles["TableHead"]),
        ]
        rows = [header]
        for pt in points[:20]:
            rows.append([
                Paragraph(f"{pt.timestamp_start}→{pt.timestamp_end}", self.styles["TableCell"]),
                Paragraph(_fmt_score(pt.scene_score), self.styles["TimelineCell"]),
                Paragraph(pt.what_works[:80] or "—", self.styles["TableCell"]),
                Paragraph(pt.what_is_average[:80] or "—", self.styles["TableCell"]),
                Paragraph(pt.improvement_area[:80] or "—", self.styles["TableCell"]),
            ])
        med_table = Table(rows, colWidths=[90, 40, 120, 120, 134])
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), MEDIUM_COLOR),
            ('BOX', (0, 0), (-1, -1), 0.5, MEDIUM_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER_COLOR),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        elems.append(med_table)
        if len(points) > 20:
            elems.append(Paragraph(f"<i>Showing 20 of {len(points)} medium points. Full data in JSON report.</i>", self.styles["SmallMuted"]))
        elems.append(Spacer(1, 8))
        return elems

    def _render_film_low_points(self, points: List[FilmLowPoint]):
        elems = []
        elems.append(Paragraph(f"9. FILM LOW POINTS ({len(points)} identified)", self.styles["SectionHeader"]))
        for pt in points:
            ts = f"{pt.timestamp_start} → {pt.timestamp_end}"
            sc_str = _fmt_score(pt.scene_score)
            conf_str = _fmt_conf(pt.confidence)
            items = [
                [Paragraph(f"<font color='#991B1B'><b>LOW PERFORMANCE SCENE</b></font>", self.styles["SmallMuted"]),
                 Paragraph(f"<b>Timestamp:</b> {ts} &nbsp;|&nbsp; <b>Score:</b> {sc_str} &nbsp;|&nbsp; <b>Category:</b> {pt.affected_category} &nbsp;|&nbsp; <b>Confidence:</b> {conf_str}", self.styles["TableCell"])],
                [Paragraph("<b>Primary Issue:</b>", self.styles["TableCellBold"]),
                 Paragraph(pt.primary_issue or "—", self.styles["TableCell"])],
            ]
            if pt.recommendation:
                items.append([Paragraph("<b>Recommendation:</b>", self.styles["TableCellBold"]),
                               Paragraph(pt.recommendation, self.styles["TableCell"])])
            if pt.evidence:
                items.append([Paragraph("<b>Evidence:</b>", self.styles["TableCellBold"]),
                               Paragraph(" | ".join(pt.evidence[:2]), self.styles["SmallMuted"])])

            card = Table(items, colWidths=[90, 414])
            card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), LOW_COLOR),
                ('BOX', (0, 0), (-1, -1), 1, LOW_BORDER),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elems.append(KeepTogether([card, Spacer(1, 6)]))
        elems.append(Spacer(1, 8))
        return elems

    def _render_character_journey(self, journey: CharacterEmotionalJourney):
        elems = []
        elems.append(Paragraph("10. CHARACTER & EMOTIONAL JOURNEY", self.styles["SectionHeader"]))
        if journey.film_emotional_progression:
            elems.append(Paragraph(journey.film_emotional_progression, self.styles["ExecutiveBody"]))
        if journey.climax_timestamp:
            elems.append(Paragraph(f"<b>Climax Timestamp:</b> {journey.climax_timestamp}", self.styles["ExecutiveBody"]))
        if journey.emotional_consistency:
            elems.append(Paragraph(f"<b>Emotional Consistency:</b> {journey.emotional_consistency}", self.styles["ExecutiveBody"]))
        elems.append(Spacer(1, 6))

        for ch in journey.characters:
            items = [
                [Paragraph(f"<b>{ch.character_name}</b>", self.styles["CardTitle"]),
                 Paragraph(f"Actor: {ch.actor_name or '—'} | Confidence: {_fmt_conf(ch.confidence)}", self.styles["SmallMuted"])],
            ]
            if ch.starting_state:
                items.append([Paragraph("<b>Starting State:</b>", self.styles["TableCellBold"]),
                               Paragraph(ch.starting_state, self.styles["TableCell"])])
            if ch.ending_state:
                items.append([Paragraph("<b>Ending State:</b>", self.styles["TableCellBold"]),
                               Paragraph(ch.ending_state, self.styles["TableCell"])])
            if ch.arc_coherence is not None:
                items.append([Paragraph("<b>Arc Coherence:</b>", self.styles["TableCellBold"]),
                               Paragraph(_fmt_score(ch.arc_coherence), self.styles["TableCell"])])
            if ch.evidence:
                items.append([Paragraph("<b>Evidence:</b>", self.styles["TableCellBold"]),
                               Paragraph(ch.evidence[0], self.styles["SmallMuted"])])

            card = Table(items, colWidths=[120, 384])
            card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
                ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elems.append(KeepTogether([card, Spacer(1, 5)]))
        elems.append(Spacer(1, 8))
        return elems

    def _render_pacing_map(self, pacing: PacingRhythmMap):
        elems = []
        elems.append(Paragraph("11. PACING & RHYTHM MAP", self.styles["SectionHeader"]))
        elems.append(Paragraph(f"<b>Overall Rhythm:</b> {pacing.overall_rhythm}", self.styles["ExecutiveBody"]))
        if pacing.pacing_consistency:
            elems.append(Paragraph(f"<b>Consistency:</b> {pacing.pacing_consistency}", self.styles["ExecutiveBody"]))
        if pacing.drag_points:
            elems.append(Paragraph("<b>Drag Points (potential audience retention issues):</b>", self.styles["SubSectionHeader"]))
            for dp in pacing.drag_points[:8]:
                elems.append(Paragraph(f"&bull; {dp}", self.styles["BulletText"]))
        if pacing.peak_intensity_moments:
            elems.append(Paragraph("<b>Peak Intensity Moments:</b>", self.styles["SubSectionHeader"]))
            for pm in pacing.peak_intensity_moments[:8]:
                elems.append(Paragraph(f"&bull; {pm}", self.styles["BulletText"]))
        if pacing.pacing_segments:
            elems.append(Paragraph("Pacing Segment Breakdown:", self.styles["SubSectionHeader"]))
            header = [
                Paragraph("<b>Start</b>", self.styles["TableHead"]),
                Paragraph("<b>End</b>", self.styles["TableHead"]),
                Paragraph("<b>Pacing</b>", self.styles["TableHead"]),
                Paragraph("<b>Avg Shot</b>", self.styles["TableHead"]),
                Paragraph("<b>Density</b>", self.styles["TableHead"]),
            ]
            rows = [header]
            for seg in pacing.pacing_segments[:20]:
                rows.append([
                    Paragraph(seg.timestamp_start, self.styles["TableCell"]),
                    Paragraph(seg.timestamp_end, self.styles["TableCell"]),
                    Paragraph(seg.pacing_label, self.styles["TableCell"]),
                    Paragraph(f"{seg.avg_shot_length_sec:.1f}s" if seg.avg_shot_length_sec else "—", self.styles["TimelineCell"]),
                    Paragraph(f"{seg.scene_density:.1f} cuts/min" if seg.scene_density else "—", self.styles["TimelineCell"]),
                ])
            pac_table = Table(rows, colWidths=[90, 90, 130, 80, 114])
            pac_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
                ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER_COLOR),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elems.append(pac_table)
        elems.append(Spacer(1, 8))
        return elems

    def _render_technical_peaks(self, peaks: List[TechnicalCreativePeak]):
        elems = []
        elems.append(Paragraph(f"12. TECHNICAL & CREATIVE PEAKS ({len(peaks)} identified)", self.styles["SectionHeader"]))
        for pk in peaks:
            dims_available = ", ".join(pk.dimensions_available[:4])
            items = [
                [Paragraph(f"<font color='{ACCENT_GOLD.hexval()}'><b>TECHNICAL PEAK</b></font>", self.styles["SmallMuted"]),
                 Paragraph(f"<b>Timestamp:</b> {pk.timestamp_range} &nbsp;|&nbsp; <b>Peak Score:</b> {_fmt_score(pk.overall_peak_score)} &nbsp;|&nbsp; <b>Confidence:</b> {_fmt_conf(pk.confidence)}", self.styles["TableCell"])],
                [Paragraph("<b>Dimensions:</b>", self.styles["TableCellBold"]),
                 Paragraph(dims_available or "—", self.styles["TableCell"])],
                [Paragraph("<b>Reason:</b>", self.styles["TableCellBold"]),
                 Paragraph(pk.reason or "—", self.styles["TableCell"])],
            ]
            card = Table(items, colWidths=[90, 414])
            card.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FFFBEB")),
                ('BOX', (0, 0), (-1, -1), 1, ACCENT_GOLD),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elems.append(KeepTogether([card, Spacer(1, 6)]))
        elems.append(Spacer(1, 8))
        return elems
