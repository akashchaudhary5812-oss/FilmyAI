export interface SceneKeyHighlight {
  timestamp_range: string;
  shot_type: string;
  visual_significance: string;
  narrative_impact: string;
}

export interface ExecutiveSummary {
  film_title: string;
  logline: string;
  commercial_verdict: string;
  overall_film_rating: number;
  commercial_tier: string;
  key_thesis: string;
  strongest_creative_areas?: string[];
  weakest_creative_areas?: string[];
  top_cast_performances?: string[];
  major_scene_highs?: string[];
  major_scene_weaknesses?: string[];
  confidence_limitations?: string | null;
}

export interface CinematographyAnalysis {
  visual_style_overview: string;
  shot_composition_assessment: string;
  lighting_and_atmosphere: string;
  pacing_and_editing_rhythm: string;
  soundscape_and_speech: string;
}

export interface CommercialAnalysis {
  box_office_outlook: string;
  primary_commercial_drivers: string[];
  key_risk_factors: string[];
  target_demographics: string[];
  franchise_and_ancillary_potential: string;
}

export interface CreativeTechnicalAssessment {
  key_strengths: string[];
  key_weaknesses: string[];
  thematic_and_narrative_cohesion: string;
}

export interface StrategicRecommendations {
  post_production_guidance: string[];
  marketing_and_positioning: string[];
  theatrical_vs_streaming_recommendation: string;
}

// ---------------------------------------------------------------------------
// v3.0 Evidence & Performance Types
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface TimestampedEvidence {
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  score?: number | null;
  category?: string;
  reason?: string;
  evidence?: string[];
  confidence?: ConfidenceLevel;
}

export interface CastPerformanceDimensions {
  acting_score?: number | null;
  emotional_connect_score?: number | null;
  dialogue_delivery_score?: number | null;
  character_consistency_score?: number | null;
  scene_impact_score?: number | null;
  character_arc_score?: number | null;
  chemistry_score?: number | null;
  dimensions_available?: string[];
}

export interface CastPerformanceItem {
  actor_name: string;
  character_name: string;
  role_category?: string;
  screen_presence?: string | null;
  scores: CastPerformanceDimensions;
  overall_performance_score?: number | null;
  confidence?: ConfidenceLevel;
  strong_moments?: TimestampedEvidence[];
  weak_moments?: TimestampedEvidence[];
  evidence?: string[];
  improvement_notes?: string | null;
}

export interface CastPerformanceAnalysis {
  cast_items: CastPerformanceItem[];
  overall_cast_assessment?: string | null;
  confidence?: ConfidenceLevel;
  evidence_notes?: string | null;
}

export interface FilmHighPoint {
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  scene_description: string;
  scene_score?: number | null;
  why_it_works: string;
  story_strength?: number | null;
  screenplay_strength?: number | null;
  acting_strength?: number | null;
  cinematography_strength?: number | null;
  audio_strength?: number | null;
  emotional_strength?: number | null;
  audience_impact?: string | null;
  evidence?: string[];
  confidence?: ConfidenceLevel;
}

export interface FilmMediumPoint {
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  scene_score?: number | null;
  what_works: string;
  what_is_average: string;
  improvement_area: string;
  evidence?: string[];
  confidence?: ConfidenceLevel;
}

export interface FilmLowPoint {
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  scene_description: string;
  scene_score?: number | null;
  primary_issue: string;
  secondary_issues?: string[];
  audience_effect?: string | null;
  affected_category?: string;
  recommendation?: string | null;
  evidence?: string[];
  confidence?: ConfidenceLevel;
}

export interface SceneTimelineEntry {
  timestamp_range: string;
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  scene_score?: number | null;
  dominant_category?: string;
  confidence?: ConfidenceLevel;
  visual_evidence?: string | null;
  acoustic_evidence?: string | null;
  shot_count?: number;
  pacing_label?: string | null;
}

export interface ScenePerformanceTimeline {
  entries: SceneTimelineEntry[];
  film_duration_sec?: number;
  total_scenes_evaluated?: number;
  average_scene_score?: number | null;
  score_std_deviation?: number | null;
  confidence?: ConfidenceLevel;
}

export interface EmotionalTransition {
  timestamp: string;
  from_state: string;
  to_state: string;
  trigger?: string | null;
  confidence?: ConfidenceLevel;
}

export interface CharacterJourneyItem {
  character_name: string;
  actor_name?: string | null;
  starting_state?: string | null;
  emotional_transitions?: EmotionalTransition[];
  turning_points?: TimestampedEvidence[];
  strongest_emotional_moment?: TimestampedEvidence | null;
  weakest_emotional_moment?: TimestampedEvidence | null;
  ending_state?: string | null;
  arc_coherence?: number | null;
  confidence?: ConfidenceLevel;
  evidence?: string[];
}

export interface CharacterEmotionalJourney {
  characters: CharacterJourneyItem[];
  film_emotional_progression?: string | null;
  major_emotional_peaks?: TimestampedEvidence[];
  emotional_drops?: TimestampedEvidence[];
  climax_timestamp?: string | null;
  resolution_quality?: string | null;
  emotional_consistency?: string | null;
  confidence?: ConfidenceLevel;
}

export interface PacingSegment {
  timestamp_start: string;
  timestamp_end: string;
  pacing_label: "SLOW" | "BALANCED" | "ACCELERATED" | "DRAG" | "RUSHED" | "PEAK";
  avg_shot_length_sec?: number | null;
  scene_density?: number | null;
  notes?: string | null;
  confidence?: ConfidenceLevel;
}

export interface PacingRhythmMap {
  overall_rhythm: string;
  pacing_segments: PacingSegment[];
  slow_sections?: string[];
  drag_points?: string[];
  rushed_sections?: string[];
  peak_intensity_moments?: string[];
  pacing_consistency?: string | null;
  transition_quality?: string | null;
  confidence?: ConfidenceLevel;
}

export interface TechnicalCreativePeak {
  timestamp_range: string;
  timestamp_start: string;
  timestamp_end: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
  cinematography_score?: number | null;
  acting_score?: number | null;
  audio_score?: number | null;
  emotion_score?: number | null;
  story_score?: number | null;
  overall_peak_score?: number | null;
  reason: string;
  evidence?: string[];
  confidence?: ConfidenceLevel;
  dimensions_available?: string[];
}

export interface FinalFilmIntelligenceReport {
  report_id: string;
  generated_at_utc: string;
  film_title: string;
  metadata_summary: Record<string, unknown>;
  story_provenance: {
    script_source?: string;
    summary_source?: string;
    [key: string]: unknown;
  };
  executive_summary: ExecutiveSummary;
  cinematography_analysis: CinematographyAnalysis;
  commercial_analysis: CommercialAnalysis;
  creative_technical_assessment: CreativeTechnicalAssessment;
  strategic_recommendations: StrategicRecommendations;
  key_scene_highlights: SceneKeyHighlight[];
  raw_ml_predictions: Record<string, unknown>;
  raw_video_metrics: Record<string, unknown>;

  // v3.0 Deep Sections (Optional)
  cast_performance?: CastPerformanceAnalysis | null;
  film_high_points?: FilmHighPoint[];
  film_medium_points?: FilmMediumPoint[];
  film_low_points?: FilmLowPoint[];
  scene_performance_timeline?: ScenePerformanceTimeline | null;
  character_emotional_journey?: CharacterEmotionalJourney | null;
  pacing_rhythm_map?: PacingRhythmMap | null;
  technical_creative_peaks?: TechnicalCreativePeak[];

  high_point_count?: number;
  medium_point_count?: number;
  low_point_count?: number;
  scene_scoring_method?: string | null;
  timestamp_validation_status?: string;
  report_version?: string;

  film_id?: string;
  pdf_report_path?: string;
  json_report_path?: string;
  rag_indexing_status?: Record<string, unknown>;
}
