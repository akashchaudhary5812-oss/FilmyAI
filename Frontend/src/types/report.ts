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
  pdf_report_path?: string;
  json_report_path?: string;
}
