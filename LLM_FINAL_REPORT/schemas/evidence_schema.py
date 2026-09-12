"""
Normalized Evidence Schemas for merging ML Commercial Predictions,
ML_VIDEO Multimodal Analysis, and Story/Script Context.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class FactorEvidence(BaseModel):
    factor: str
    impact: str


class CommercialEvidence(BaseModel):
    """Normalized evidence from existing ML commercial predictor."""
    status: str = "available"  # "available" | "failed" | "not_available"
    model_version: str = "1.0.0-filmyai-ml"
    predicted_commercial_class: str = "Unknown"
    predicted_class_code: int = -1
    commercial_success_probability: float = 0.0
    model_confidence: float = 0.0
    predicted_commercial_score: float = 0.0
    commercial_score_scale: str = "1.0 (Disaster) to 9.0 (Historic Blockbuster)"
    class_probabilities: Dict[str, float] = Field(default_factory=dict)
    important_contributing_factors: List[FactorEvidence] = Field(default_factory=list)
    box_office_numeric_prediction: str = "not_available"
    imdb_rating_prediction: str = "not_available"
    error_message: Optional[str] = None


class VideoCinematographyEvidence(BaseModel):
    """Normalized evidence from existing ML_VIDEO intelligence engine."""
    status: str = "available"  # "available" | "failed" | "not_available"
    engine_version: str = "2.0.0"
    video_source: str = ""
    duration_seconds: float = 0.0
    resolution: str = "N/A"
    aspect_ratio: str = "N/A"
    total_scenes: int = 0
    total_shots: int = 0
    average_shot_length_sec: float = 0.0
    pacing_rhythm: str = "N/A"
    cuts_per_minute: float = 0.0
    predominant_shot_scale: str = "N/A"
    predominant_lighting_style: str = "N/A"
    audio_speech_activity: str = "N/A"
    shot_scale_distribution: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    lighting_style_distribution: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    composition_distribution: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    keyframe_paths: List[str] = Field(default_factory=list)
    top_shots_summary: List[Dict[str, Any]] = Field(default_factory=list)
    error_message: Optional[str] = None


class StoryContextEvidence(BaseModel):
    """Script & Summary evidence resolved under strict priority rules."""
    case_mode: str  # "CASE_1", "CASE_2", "CASE_3", "CASE_4"
    script_source: str  # "USER_PROVIDED" | "AI_GENERATED" | "NOT_AVAILABLE"
    summary_source: str  # "USER_PROVIDED" | "AI_GENERATED"
    script_content: Optional[str] = None
    summary_content: str = ""
    generated_notes: Optional[str] = None


class NormalizedEvidence(BaseModel):
    """Unified composite evidence passed to Groq LLM and Report Generator."""
    title: str
    director: str
    actors: List[str]
    production_houses: List[str]
    budget: float
    genre: str
    release_year: int
    release_month: int
    is_sequel: bool
    commercial_evidence: CommercialEvidence
    video_evidence: VideoCinematographyEvidence
    story_evidence: StoryContextEvidence
    timestamp_utc: str
