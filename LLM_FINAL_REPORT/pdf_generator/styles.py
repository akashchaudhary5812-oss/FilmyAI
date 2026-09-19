"""
Styling and Canvas layout for FilmyAI PDF reports.
Provides a luxury, executive studio aesthetic with clean typography and palettes.
"""
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# Luxury / Executive Color Palette
PRIMARY_DARK = colors.HexColor("#0F172A")    # Deep Slate / Navy
ACCENT_GOLD = colors.HexColor("#D97706")     # Warm Studio Gold
ACCENT_TEAL = colors.HexColor("#0D9488")     # Cinematic Cyan/Teal
ACCENT_RED = colors.HexColor("#E11D48")      # Alert Rose
BG_LIGHT = colors.HexColor("#F8FAFC")        # Soft Canvas Off-White
CARD_BG = colors.HexColor("#F1F5F9")         # Muted Card Background
TEXT_MAIN = colors.HexColor("#1E293B")       # Crisp Charcoal Body Text
TEXT_MUTED = colors.HexColor("#64748B")      # Slate Secondary Text
BORDER_COLOR = colors.HexColor("#CBD5E1")    # Subtle Border Gray
BADGE_BG_USER = colors.HexColor("#DCFCE7")   # Light green for User-Provided
BADGE_TXT_USER = colors.HexColor("#166534")
BADGE_BG_AI = colors.HexColor("#E0E7FF")     # Light indigo for AI-Generated
BADGE_TXT_AI = colors.HexColor("#3730A3")


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count (e.g. 'Page 1 of 4')
    and consistent executive header & footer rules.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(TEXT_MUTED)

        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "FILMY AI — FILM INTELLIGENCE & STUDIO ANALYSIS REPORT")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (All pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY — FILMY AI PLATFORM")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)

        self.restoreState()


def get_report_styles():
    """Generates custom typography styles for FilmyAI PDF generation."""
    styles = getSampleStyleSheet()

    # Title & Main Headers
    styles.add(ParagraphStyle(
        name="FilmTitleHeader",
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=PRIMARY_DARK,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="FilmSubHeader",
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=TEXT_MUTED,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=PRIMARY_DARK,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name="SubSectionHeader",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=ACCENT_TEAL,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))

    # Body & Content
    styles.add(ParagraphStyle(
        name="ExecutiveBody",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_MAIN,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name="ExecutiveBodyBold",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=PRIMARY_DARK,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="BulletText",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT_MAIN,
        spaceAfter=3,
        leftIndent=12
    ))

    styles.add(ParagraphStyle(
        name="BadgeTextUser",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=BADGE_TXT_USER
    ))

    styles.add(ParagraphStyle(
        name="BadgeTextAI",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=BADGE_TXT_AI
    ))

    styles.add(ParagraphStyle(
        name="TableHead",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=PRIMARY_DARK
    ))

    styles.add(ParagraphStyle(
        name="TableCell",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=TEXT_MAIN
    ))

    styles.add(ParagraphStyle(
        name="TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_DARK
    ))

    styles.add(ParagraphStyle(
        name="ScorecardValue",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=PRIMARY_DARK
    ))

    styles.add(ParagraphStyle(
        name="ScorecardLabel",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=1, # Center
        textColor=TEXT_MUTED
    ))

    # v3.0 new styles
    styles.add(ParagraphStyle(
        name="ScoreBadgeHigh",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#166534"),
    ))

    styles.add(ParagraphStyle(
        name="ScoreBadgeMedium",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#92400E"),
    ))

    styles.add(ParagraphStyle(
        name="ScoreBadgeLow",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#991B1B"),
    ))

    styles.add(ParagraphStyle(
        name="TimelineCell",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=TEXT_MAIN,
        alignment=1,
    ))

    styles.add(ParagraphStyle(
        name="CardTitle",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=PRIMARY_DARK,
        spaceAfter=2,
    ))

    styles.add(ParagraphStyle(
        name="SmallMuted",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MUTED,
    ))

    return styles
