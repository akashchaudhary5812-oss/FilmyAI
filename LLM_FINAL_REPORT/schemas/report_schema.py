"""
Structured Report Schema for Validated LLM Output and PDF Rendering.
v3.0 — Enhanced with evidence-driven Cast Performance, Dynamic Scene Points,
Scene Performance Timeline, Character Emotional Journey, Pacing & Rhythm Map,
and Technical & Creative Peaks. All new fields are Optional with safe defaults
for full backward compatibility with existing reports and consumers.
"""
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Existing core models (unchanged for backward compatibility)
# ---------------------------------------------------------------------------

class SceneKeyHighlight(BaseModel):
    timestamp_range: str = Field(..., description="E.g. '00:00 - 00:04'")
    shot_type: str = Field("Medium Shot", description="E.g. 'Close-Up', 'Extreme Long Shot'")
    visual_significance: str = Field(..., description="Cinematic observation")
    narrative_impact: str = Field(..., description="Dramatic or commercial impact")


class ExecutiveSummary(BaseModel):
    film_title: str
    logline: str = Field(..., description="Punchy, professional industry logline")
    commercial_verdict: str = Field(..., description="E.g. 'High Commercial Potential / Super Hit Trajectory'")
    overall_film_rating: float = Field(..., ge=1.0, le=10.0, description="Overall blended score on 1.0 - 10.0 scale")
    commercial_tier: str = Field(..., description="E.g. 'Blockbuster / Major Studio Tier', 'Profitable Mid-Budget'")
    key_thesis: str = Field(..., description="Executive summary paragraph synthesizing visual and commercial findings")
    # v3.0 additions (optional for backward compat)
    strongest_creative_areas: List[str] = Field(default_factory=list)
    weakest_creative_areas: List[str] = Field(default_factory=list)
    top_cast_performances: List[str] = Field(default_factory=list)
    major_scene_highs: List[str] = Field(default_factory=list)
    major_scene_weaknesses: List[str] = Field(default_factory=list)
    confidence_limitations: Optional[str] = None


class CinematographyAnalysis(BaseModel):
    visual_style_overview: str = Field(..., description="High-level analysis of camera language and aesthetics")
    shot_composition_assessment: str = Field(..., description="Assessment of framing, rule of thirds, shot scales")
    lighting_and_atmosphere: str = Field(..., description="Analysis of lighting schemes (chiaroscuro, high-key, mood)")
    pacing_and_editing_rhythm: str = Field(..., description="Evaluation of cuts per minute and shot duration")
    soundscape_and_speech: str = Field(..., description="Acoustic analysis and speech dynamic evaluation")


class CommercialAnalysis(BaseModel):
    box_office_outlook: str = Field(..., description="Market analysis based on ML commercial prediction")
    primary_commercial_drivers: List[str] = Field(..., description="Key revenue and appeal catalysts")
    key_risk_factors: List[str] = Field(..., description="Market, budget, or creative risks")
    target_demographics: List[str] = Field(..., description="Primary audience segments (e.g. Gen Z, Festive Family)")
    franchise_and_ancillary_potential: str = Field(..., description="Sequel, streaming, and merchandise potential")


class CreativeTechnicalAssessment(BaseModel):
    key_strengths: List[str] = Field(..., description="Top 3-5 artistic and technical strengths")
    key_weaknesses: List[str] = Field(..., description="Top 3-5 areas requiring improvement or caution")
    thematic_and_narrative_cohesion: str = Field(..., description="Evaluation of story logic and audience engagement")


class StrategicRecommendations(BaseModel):
    post_production_guidance: List[str] = Field(..., description="Editing, color grading, or sound suggestions")
    marketing_and_positioning: List[str] = Field(..., description="Trailer beats, marketing hooks, festival strategy")
    theatrical_vs_streaming_recommendation: str = Field(..., description="Release window optimization advice")


# ---------------------------------------------------------------------------
# v3.0 NEW: Timestamped Evidence Model
# ---------------------------------------------------------------------------

class TimestampedEvidence(BaseModel):
    """A single piece of evidence associated with a specific timestamp window."""
    timestamp_start: str = Field("00:00:00", description="Start timestamp HH:MM:SS")
    timestamp_end: str = Field("00:00:00", description="End timestamp HH:MM:SS")
    timestamp_start_sec: float = Field(0.0, description="Start in seconds (for validation)")
    timestamp_end_sec: float = Field(0.0, description="End in seconds (for validation)")
    score: Optional[float] = Field(None, description="Score 0-10 or None if insufficient evidence")
    category: str = Field("GENERAL", description="Category of evidence")
    reason: str = Field("", description="Reason or interpretation")
    evidence: List[str] = Field(default_factory=list)
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "LOW"


# ---------------------------------------------------------------------------
# v3.0 NEW: Cast Performance Analysis
# ---------------------------------------------------------------------------

RoleCategory = Literal[
    "LEAD", "LEAD_SUPPORT", "ANTAGONIST", "SUPPORTING",
    "COMIC", "SPECIAL_APPEARANCE", "OTHER"
]

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]


class CastPerformanceDimensions(BaseModel):
    """Score breakdown for a single cast member. None = insufficient evidence."""
    acting_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    emotional_connect_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    dialogue_delivery_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    character_consistency_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    scene_impact_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    character_arc_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    chemistry_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    dimensions_available: List[str] = Field(default_factory=list, description="Which dimensions have real evidence")


class CastPerformanceItem(BaseModel):
    """Evidence-driven performance analysis for a single cast member."""
    actor_name: str
    character_name: str
    role_category: str = "OTHER"
    screen_presence: Optional[str] = None
    scores: CastPerformanceDimensions = Field(default_factory=CastPerformanceDimensions)
    overall_performance_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    confidence: ConfidenceLevel = "LOW"
    strong_moments: List[TimestampedEvidence] = Field(default_factory=list)
    weak_moments: List[TimestampedEvidence] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    improvement_notes: Optional[str] = None


class CastPerformanceAnalysis(BaseModel):
    """Full cast performance analysis section."""
    cast_items: List[CastPerformanceItem] = Field(default_factory=list)
    overall_cast_assessment: Optional[str] = None
    confidence: ConfidenceLevel = "LOW"
    evidence_notes: Optional[str] = None


# ---------------------------------------------------------------------------
# v3.0 NEW: Film High / Medium / Low Points (Dynamic Counts)
# ---------------------------------------------------------------------------

class FilmHighPoint(BaseModel):
    """A sequence where the film performs exceptionally well across multiple dimensions."""
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    timestamp_start_sec: float = 0.0
    timestamp_end_sec: float = 0.0
    scene_description: str = ""
    scene_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    why_it_works: str = ""
    story_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    screenplay_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    acting_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    cinematography_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    audio_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    emotional_strength: Optional[float] = Field(None, ge=0.0, le=10.0)
    audience_impact: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = "LOW"


class FilmMediumPoint(BaseModel):
    """A sequence that functions reasonably well but has clear room for improvement."""
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    timestamp_start_sec: float = 0.0
    timestamp_end_sec: float = 0.0
    scene_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    what_works: str = ""
    what_is_average: str = ""
    improvement_area: str = ""
    evidence: List[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = "LOW"


FilmLowCategory = Literal[
    "STORY", "SCREENPLAY", "PACING", "ACTING", "DIALOGUE",
    "CINEMATOGRAPHY", "AUDIO", "VFX", "CONTINUITY",
    "EMOTIONAL_IMPACT", "OTHER"
]


class FilmLowPoint(BaseModel):
    """A sequence where the film performs weakest based on actual evidence."""
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    timestamp_start_sec: float = 0.0
    timestamp_end_sec: float = 0.0
    scene_description: str = ""
    scene_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    primary_issue: str = ""
    secondary_issues: List[str] = Field(default_factory=list)
    audience_effect: Optional[str] = None
    affected_category: str = "OTHER"
    recommendation: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = "LOW"


# ---------------------------------------------------------------------------
# v3.0 NEW: Scene Performance Timeline
# ---------------------------------------------------------------------------

class SceneTimelineEntry(BaseModel):
    """One chronological entry in the scene performance timeline."""
    timestamp_range: str = "00:00 - 00:00"
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    timestamp_start_sec: float = 0.0
    timestamp_end_sec: float = 0.0
    scene_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    dominant_category: str = "GENERAL"
    confidence: ConfidenceLevel = "LOW"
    visual_evidence: Optional[str] = None
    acoustic_evidence: Optional[str] = None
    shot_count: int = 0
    pacing_label: Optional[str] = None


class ScenePerformanceTimeline(BaseModel):
    """Complete chronological scene performance timeline for the film."""
    entries: List[SceneTimelineEntry] = Field(default_factory=list)
    film_duration_sec: float = 0.0
    total_scenes_evaluated: int = 0
    average_scene_score: Optional[float] = None
    score_std_deviation: Optional[float] = None
    confidence: ConfidenceLevel = "LOW"


# ---------------------------------------------------------------------------
# v3.0 NEW: Character & Emotional Journey
# ---------------------------------------------------------------------------

class EmotionalTransition(BaseModel):
    timestamp: str = ""
    from_state: str = ""
    to_state: str = ""
    trigger: Optional[str] = None
    confidence: ConfidenceLevel = "LOW"


class CharacterJourneyItem(BaseModel):
    """Emotional arc and journey for a single major character."""
    character_name: str
    actor_name: Optional[str] = None
    starting_state: Optional[str] = None
    emotional_transitions: List[EmotionalTransition] = Field(default_factory=list)
    turning_points: List[TimestampedEvidence] = Field(default_factory=list)
    strongest_emotional_moment: Optional[TimestampedEvidence] = None
    weakest_emotional_moment: Optional[TimestampedEvidence] = None
    ending_state: Optional[str] = None
    arc_coherence: Optional[float] = Field(None, ge=0.0, le=10.0)
    confidence: ConfidenceLevel = "LOW"
    evidence: List[str] = Field(default_factory=list)


class CharacterEmotionalJourney(BaseModel):
    """Full character & emotional journey section."""
    characters: List[CharacterJourneyItem] = Field(default_factory=list)
    film_emotional_progression: Optional[str] = None
    major_emotional_peaks: List[TimestampedEvidence] = Field(default_factory=list)
    emotional_drops: List[TimestampedEvidence] = Field(default_factory=list)
    climax_timestamp: Optional[str] = None
    resolution_quality: Optional[str] = None
    emotional_consistency: Optional[str] = None
    confidence: ConfidenceLevel = "LOW"


# ---------------------------------------------------------------------------
# v3.0 NEW: Pacing & Rhythm Map
# ---------------------------------------------------------------------------

class PacingSegment(BaseModel):
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    pacing_label: Literal["SLOW", "BALANCED", "ACCELERATED", "DRAG", "RUSHED", "PEAK"] = "BALANCED"
    avg_shot_length_sec: Optional[float] = None
    scene_density: Optional[float] = None
    notes: Optional[str] = None
    confidence: ConfidenceLevel = "LOW"


class PacingRhythmMap(BaseModel):
    """Chronological pacing and rhythm analysis across the film."""
    overall_rhythm: str = ""
    pacing_segments: List[PacingSegment] = Field(default_factory=list)
    slow_sections: List[str] = Field(default_factory=list, description="Timestamps of slow sections")
    drag_points: List[str] = Field(default_factory=list, description="Where audience retention may drop")
    rushed_sections: List[str] = Field(default_factory=list)
    peak_intensity_moments: List[str] = Field(default_factory=list)
    pacing_consistency: Optional[str] = None
    transition_quality: Optional[str] = None
    confidence: ConfidenceLevel = "LOW"


# ---------------------------------------------------------------------------
# v3.0 NEW: Technical & Creative Peaks
# ---------------------------------------------------------------------------

class TechnicalCreativePeak(BaseModel):
    """A moment where multiple analytical dimensions perform strongly together."""
    timestamp_range: str = "00:00 - 00:00"
    timestamp_start: str = "00:00:00"
    timestamp_end: str = "00:00:00"
    timestamp_start_sec: float = 0.0
    timestamp_end_sec: float = 0.0
    cinematography_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    acting_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    audio_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    emotion_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    story_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    overall_peak_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    reason: str = ""
    evidence: List[str] = Field(default_factory=list)
    confidence: ConfidenceLevel = "LOW"
    dimensions_available: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# v3.0 Main Report Schema (fully backward compatible)
# ---------------------------------------------------------------------------

class FinalFilmIntelligenceReport(BaseModel):
    """
    Complete, validated FilmyAI Film Intelligence & Analysis Report.
    v3.0 — Deeply structured, evidence-driven, timestamp-aware, scene-aware,
    character-aware and performance-aware.
    All v3.0 fields are Optional with defaults for backward compatibility.
    """
    # --- Core identity (unchanged) ---
    report_id: str
    generated_at_utc: str
    film_title: str
    metadata_summary: Dict[str, Any]
    story_provenance: Dict[str, str] = Field(..., description="Explicit source tags for script/summary")

    # --- Existing sections (unchanged) ---
    executive_summary: ExecutiveSummary
    cinematography_analysis: CinematographyAnalysis
    commercial_analysis: CommercialAnalysis
    creative_technical_assessment: CreativeTechnicalAssessment
    strategic_recommendations: StrategicRecommendations
    key_scene_highlights: List[SceneKeyHighlight] = Field(default_factory=list)
    raw_ml_predictions: Dict[str, Any] = Field(default_factory=dict)
    raw_video_metrics: Dict[str, Any] = Field(default_factory=dict)

    # --- v3.0 NEW sections (all Optional with safe defaults) ---
    cast_performance: Optional[CastPerformanceAnalysis] = None
    film_high_points: List[FilmHighPoint] = Field(default_factory=list)
    film_medium_points: List[FilmMediumPoint] = Field(default_factory=list)
    film_low_points: List[FilmLowPoint] = Field(default_factory=list)
    scene_performance_timeline: Optional[ScenePerformanceTimeline] = None
    character_emotional_journey: Optional[CharacterEmotionalJourney] = None
    pacing_rhythm_map: Optional[PacingRhythmMap] = None
    technical_creative_peaks: List[TechnicalCreativePeak] = Field(default_factory=list)

    # --- Report classification metadata ---
    high_point_count: int = Field(0, description="Dynamic: number of high points found")
    medium_point_count: int = Field(0, description="Dynamic: number of medium points found")
    low_point_count: int = Field(0, description="Dynamic: number of low points found")
    scene_scoring_method: Optional[str] = None
    timestamp_validation_status: str = "NOT_VALIDATED"
    report_version: str = "3.0.0"

    # --- Existing optional path fields (unchanged) ---
    film_id: Optional[str] = None
    pdf_report_path: Optional[str] = None
    json_report_path: Optional[str] = None
    rag_indexing_status: Optional[Dict[str, Any]] = None
