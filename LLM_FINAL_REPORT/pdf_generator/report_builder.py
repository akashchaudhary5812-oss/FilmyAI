"""
PDF Report Builder for FILMY AI.
Generates an executive-level, multi-page studio intelligence PDF report using ReportLab.
"""
from pathlib import Path
from typing import Optional, List

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

from LLM_FINAL_REPORT.schemas.report_schema import FinalFilmIntelligenceReport
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


class FilmReportPDFBuilder:
    """
    Builds studio-grade PDF reports from a FinalFilmIntelligenceReport instance.
    """
    def __init__(self, output_path: str):
        self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self.styles = get_report_styles()

    def build(self, report: FinalFilmIntelligenceReport) -> str:
        """
        Executes document rendering and saves to output_path.
        """
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
        story.append(Paragraph(f"<b>FILMY AI</b> &bull; STUDIO FILM INTELLIGENCE REPORT", self.styles["FilmSubHeader"]))
        story.append(Paragraph(report.film_title.upper(), self.styles["FilmTitleHeader"]))
        
        # Metadata Strip
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
        conf_val = f"{raw_comm.get('confidence', 0.5) * 100:.0f}%"
        verdict_val = raw_comm.get("predicted_commercial_class", "Average").upper()

        score_data = [
            [
                Paragraph("COMMERCIAL VERDICT", self.styles["ScorecardLabel"]),
                Paragraph("COMMERCIAL SCORE", self.styles["ScorecardLabel"]),
                Paragraph("HIT PROBABILITY", self.styles["ScorecardLabel"]),
                Paragraph("MODEL CONFIDENCE", self.styles["ScorecardLabel"]),
                Paragraph("OVERALL RATING", self.styles["ScorecardLabel"])
            ],
            [
                Paragraph(f"<font color='{ACCENT_GOLD.hexval()}'><b>{verdict_val}</b></font>", self.styles["ScorecardValue"]),
                Paragraph(score_val, self.styles["ScorecardValue"]),
                Paragraph(prob_val, self.styles["ScorecardValue"]),
                Paragraph(conf_val, self.styles["ScorecardValue"]),
                Paragraph(f"{exec_s.overall_film_rating:.1f}/10", self.styles["ScorecardValue"])
            ]
        ]
        score_table = Table(score_data, colWidths=[110, 95, 95, 100, 104])
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
        story.append(Spacer(1, 8))

        # ==========================================
        # 4. STORY & SCREENPLAY (PROVENANCE AWARE)
        # ==========================================
        story.append(Paragraph("2. STORY & SCREENPLAY CONTEXT", self.styles["SectionHeader"]))
        
        # Provenance indicator
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
        # 5. COMMERCIAL & BOX OFFICE PREDICTION
        # ==========================================
        story.append(Paragraph("3. COMMERCIAL & BOX OFFICE INTELLIGENCE", self.styles["SectionHeader"]))
        story.append(Paragraph(comm.box_office_outlook, self.styles["ExecutiveBody"]))
        
        story.append(Paragraph("Key Commercial Catalysts & Drivers:", self.styles["SubSectionHeader"]))
        for driver in comm.primary_commercial_drivers:
            story.append(Paragraph(f"&bull; {driver}", self.styles["BulletText"]))

        story.append(Paragraph("Market & Execution Risk Factors:", self.styles["SubSectionHeader"]))
        for risk in comm.key_risk_factors:
            story.append(Paragraph(f"&bull; {risk}", self.styles["BulletText"]))

        story.append(Paragraph(f"<b>Target Demographic:</b> {', '.join(comm.target_demographics)}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Franchise & Ancillary Potential:</b> {comm.franchise_and_ancillary_potential}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 6. MULTIMODAL VIDEO & CINEMATOGRAPHY
        # ==========================================
        raw_vid = report.raw_video_metrics
        story.append(Paragraph("4. MULTIMODAL CINEMATOGRAPHY & VIDEO INTELLIGENCE", self.styles["SectionHeader"]))
        story.append(Paragraph(cin.visual_style_overview, self.styles["ExecutiveBody"]))

        # Video Metrics Table
        dur_val = f"{raw_vid.get('duration_seconds', 0):.1f}s"
        shots_val = str(raw_vid.get('total_shots', 0))
        pacing_val = raw_vid.get('pacing_rhythm', 'Moderate')
        lighting_val = raw_vid.get('predominant_lighting_style', 'N/A')
        speech_val = raw_vid.get('audio_speech_activity', 'N/A')

        vid_data = [
            [
                Paragraph("<b>Duration</b>", self.styles["TableHead"]),
                Paragraph("<b>Total Shots</b>", self.styles["TableHead"]),
                Paragraph("<b>Pacing Rhythm</b>", self.styles["TableHead"]),
                Paragraph("<b>Predominant Lighting</b>", self.styles["TableHead"]),
                Paragraph("<b>Acoustic Speech Mode</b>", self.styles["TableHead"])
            ],
            [
                Paragraph(dur_val, self.styles["TableCell"]),
                Paragraph(shots_val, self.styles["TableCell"]),
                Paragraph(pacing_val, self.styles["TableCell"]),
                Paragraph(lighting_val, self.styles["TableCell"]),
                Paragraph(speech_val, self.styles["TableCell"])
            ]
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

        story.append(Paragraph(f"<b>Composition & Framing:</b> {cin.shot_composition_assessment}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Lighting & Atmosphere:</b> {cin.lighting_and_atmosphere}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Editing & Rhythm:</b> {cin.pacing_and_editing_rhythm}", self.styles["ExecutiveBody"]))
        story.append(Paragraph(f"<b>Soundscape & Speech:</b> {cin.soundscape_and_speech}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 7. CREATIVE & TECHNICAL SWOT
        # ==========================================
        story.append(Paragraph("5. CREATIVE & TECHNICAL EVALUATION", self.styles["SectionHeader"]))
        story.append(Paragraph("Artistic & Technical Strengths:", self.styles["SubSectionHeader"]))
        for strength in creat.key_strengths:
            story.append(Paragraph(f"<font color='{ACCENT_TEAL.hexval()}'>&check;</font> {strength}", self.styles["BulletText"]))

        story.append(Paragraph("Areas for Technical Improvement / Caution:", self.styles["SubSectionHeader"]))
        for weak in creat.key_weaknesses:
            story.append(Paragraph(f"<font color='{ACCENT_RED.hexval()}'>&times;</font> {weak}", self.styles["BulletText"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 8. STRATEGIC STUDIO RECOMMENDATIONS
        # ==========================================
        story.append(Paragraph("6. STRATEGIC STUDIO RECOMMENDATIONS", self.styles["SectionHeader"]))
        story.append(Paragraph("Post-Production & Editorial Guidance:", self.styles["SubSectionHeader"]))
        for rec in strat.post_production_guidance:
            story.append(Paragraph(f"&bull; {rec}", self.styles["BulletText"]))

        story.append(Paragraph("Marketing & Audience Positioning:", self.styles["SubSectionHeader"]))
        for mkt in strat.marketing_and_positioning:
            story.append(Paragraph(f"&bull; {mkt}", self.styles["BulletText"]))

        story.append(Paragraph(f"<b>Distribution Strategy:</b> {strat.theatrical_vs_streaming_recommendation}", self.styles["ExecutiveBody"]))
        story.append(Spacer(1, 8))

        # ==========================================
        # 9. KEY SCENE / SHOT HIGHLIGHTS TABLE
        # ==========================================
        if report.key_scene_highlights:
            story.append(Paragraph("7. KEY SEQUENCE & SHOT HIGHLIGHTS", self.styles["SectionHeader"]))
            hl_data = [
                [
                    Paragraph("<b>Timestamp</b>", self.styles["TableHead"]),
                    Paragraph("<b>Shot Scale</b>", self.styles["TableHead"]),
                    Paragraph("<b>Visual Significance</b>", self.styles["TableHead"]),
                    Paragraph("<b>Narrative Impact</b>", self.styles["TableHead"])
                ]
            ]
            for h in report.key_scene_highlights[:5]:
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
        # 10. DISCLAIMER & TECHNICAL PROVENANCE
        # ==========================================
        disclaimer = (
            f"<i>Report ID: {report.report_id} &bull; Timestamp (UTC): {report.generated_at_utc} &bull; "
            f"Commercial ML Engine: v{raw_comm.get('model_version', '1.0.0')} &bull; "
            f"Video Intelligence Engine: v{raw_vid.get('engine_version', '2.0.0')} &bull; "
            f"FilmyAI Platform.</i>"
        )
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=6))
        story.append(Paragraph(disclaimer, self.styles["TableCell"]))

        # Build document
        doc.build(story, canvasmaker=NumberedCanvas)
        return str(self.output_path)
