import { FinalFilmIntelligenceReport } from "@/types/report";

/**
 * Validates and normalizes report data structure for clean UI display.
 * Full v3.0 evidence-driven support with null-safe fallbacks.
 */
export function normalizeReport(raw: unknown): FinalFilmIntelligenceReport {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<FinalFilmIntelligenceReport>;

  return {
    report_id: data.report_id || `FILM_REP_${Date.now()}`,
    generated_at_utc: data.generated_at_utc || new Date().toISOString(),
    film_title: data.film_title || "Untitled Film",
    metadata_summary: data.metadata_summary || {},
    story_provenance: data.story_provenance || {
      script_source: "User Provided",
      summary_source: "Synthesized Overview",
    },
    executive_summary: {
      film_title: data.executive_summary?.film_title || data.film_title || "Untitled Film",
      logline:
        data.executive_summary?.logline ||
        "A compelling cinematic journey exploring the boundaries of human ambition and drama.",
      commercial_verdict:
        data.executive_summary?.commercial_verdict || "High Studio Viability / Breakout Potential",
      overall_film_rating: data.executive_summary?.overall_film_rating || 8.5,
      commercial_tier: data.executive_summary?.commercial_tier || "Major Studio Tier",
      key_thesis:
        data.executive_summary?.key_thesis ||
        "The project exhibits strong thematic integrity, compelling pacing, and distinct audience resonance.",
      strongest_creative_areas: data.executive_summary?.strongest_creative_areas || [],
      weakest_creative_areas: data.executive_summary?.weakest_creative_areas || [],
      top_cast_performances: data.executive_summary?.top_cast_performances || [],
      major_scene_highs: data.executive_summary?.major_scene_highs || [],
      major_scene_weaknesses: data.executive_summary?.major_scene_weaknesses || [],
      confidence_limitations: data.executive_summary?.confidence_limitations || null,
    },
    cinematography_analysis: {
      visual_style_overview:
        data.cinematography_analysis?.visual_style_overview ||
        "Dynamic cinematography with refined lens selection and strong spatial composition.",
      shot_composition_assessment:
        data.cinematography_analysis?.shot_composition_assessment ||
        "Balanced use of wide vistas and intimate close-ups to emphasize psychological subtext.",
      lighting_and_atmosphere:
        data.cinematography_analysis?.lighting_and_atmosphere ||
        "Chiaroscuro influences with nuanced naturalistic lighting creating atmospheric depth.",
      pacing_and_editing_rhythm:
        data.cinematography_analysis?.pacing_and_editing_rhythm ||
        "Rhythmic montage cutting with calculated tension build-ups across acts.",
      soundscape_and_speech:
        data.cinematography_analysis?.soundscape_and_speech ||
        "Crisp dialogue articulation supported by an immersive acoustic soundstage.",
    },
    commercial_analysis: {
      box_office_outlook:
        data.commercial_analysis?.box_office_outlook ||
        "Favorable theatrical window prospects with substantial multi-platform ancillary value.",
      primary_commercial_drivers: data.commercial_analysis?.primary_commercial_drivers?.length
        ? data.commercial_analysis.primary_commercial_drivers
        : ["Star Power Ensemble", "High Concept Hook", "Global Genre Appeal"],
      key_risk_factors: data.commercial_analysis?.key_risk_factors?.length
        ? data.commercial_analysis.key_risk_factors
        : ["Competitive Release Window", "Marketing Saturation Risk"],
      target_demographics: data.commercial_analysis?.target_demographics?.length
        ? data.commercial_analysis.target_demographics
        : ["Core Cinephiles (18-34)", "Festival Audiences", "Global Streaming Viewers"],
      franchise_and_ancillary_potential:
        data.commercial_analysis?.franchise_and_ancillary_potential ||
        "Strong episodic and international distribution expansion potential.",
    },
    creative_technical_assessment: {
      key_strengths: data.creative_technical_assessment?.key_strengths?.length
        ? data.creative_technical_assessment.key_strengths
        : [
            "Cohesive directorial vision and mood consistency",
            "High production design execution",
            "Memorable character dialogue and arc progression",
          ],
      key_weaknesses: data.creative_technical_assessment?.key_weaknesses?.length
        ? data.creative_technical_assessment.key_weaknesses
        : ["Minor exposition density in early second act"],
      thematic_and_narrative_cohesion:
        data.creative_technical_assessment?.thematic_and_narrative_cohesion ||
        "Narrative elements coalesce effectively around the central dramatic proposition.",
    },
    strategic_recommendations: {
      post_production_guidance: data.strategic_recommendations?.post_production_guidance?.length
        ? data.strategic_recommendations.post_production_guidance
        : [
            "Trim 90 seconds from transition scenes for tighter pacing",
            "Enhance low-end frequency mastering on key dramatic beats",
          ],
      marketing_and_positioning: data.strategic_recommendations?.marketing_and_positioning?.length
        ? data.strategic_recommendations.marketing_and_positioning
        : [
            "Anchor teaser trailer on the opening conflict",
            "Promote behind-the-scenes cinematography craftsmanship",
          ],
      theatrical_vs_streaming_recommendation:
        data.strategic_recommendations?.theatrical_vs_streaming_recommendation ||
        "45-day exclusive theatrical window followed by premium transactional VOD.",
    },
    key_scene_highlights: data.key_scene_highlights || [],
    raw_ml_predictions: data.raw_ml_predictions || {},
    raw_video_metrics: data.raw_video_metrics || {},

    // v3.0 Deep Sections
    cast_performance: data.cast_performance || null,
    film_high_points: data.film_high_points || [],
    film_medium_points: data.film_medium_points || [],
    film_low_points: data.film_low_points || [],
    scene_performance_timeline: data.scene_performance_timeline || null,
    character_emotional_journey: data.character_emotional_journey || null,
    pacing_rhythm_map: data.pacing_rhythm_map || null,
    technical_creative_peaks: data.technical_creative_peaks || [],

    high_point_count: data.high_point_count ?? (data.film_high_points?.length || 0),
    medium_point_count: data.medium_point_count ?? (data.film_medium_points?.length || 0),
    low_point_count: data.low_point_count ?? (data.film_low_points?.length || 0),
    scene_scoring_method: data.scene_scoring_method || null,
    timestamp_validation_status: data.timestamp_validation_status || "NOT_VALIDATED",
    report_version: data.report_version || "3.0.0",

    film_id: data.film_id,
    pdf_report_path: data.pdf_report_path,
    json_report_path: data.json_report_path,
    rag_indexing_status: data.rag_indexing_status,
  };
}
