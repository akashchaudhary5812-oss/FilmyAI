"""
Structured Report Schema for Validated LLM Output and PDF Rendering.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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


class FinalFilmIntelligenceReport(BaseModel):
    """
    Complete, validated FilmyAI Film Intelligence & Analysis Report.
    """
    report_id: str
    generated_at_utc: str
    film_title: str
    metadata_summary: Dict[str, Any]
    story_provenance: Dict[str, str] = Field(..., description="Explicit source tags for script/summary")
    executive_summary: ExecutiveSummary
    cinematography_analysis: CinematographyAnalysis
    commercial_analysis: CommercialAnalysis
    creative_technical_assessment: CreativeTechnicalAssessment
    strategic_recommendations: StrategicRecommendations
    key_scene_highlights: List[SceneKeyHighlight] = Field(default_factory=list)
    raw_ml_predictions: Dict[str, Any] = Field(default_factory=dict)
    raw_video_metrics: Dict[str, Any] = Field(default_factory=dict)
    film_id: Optional[str] = None
    pdf_report_path: Optional[str] = None
    json_report_path: Optional[str] = None
    rag_indexing_status: Optional[Dict[str, Any]] = None
