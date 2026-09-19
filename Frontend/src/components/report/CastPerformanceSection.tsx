import React from "react";
import { FinalFilmIntelligenceReport, CastPerformanceItem } from "@/types/report";
import { Users, Star, Award, AlertCircle, Sparkles, TrendingUp, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "../ui/Badge";

interface CastPerformanceSectionProps {
  report: FinalFilmIntelligenceReport;
}

export function CastPerformanceSection({ report }: CastPerformanceSectionProps) {
  const castAnalysis = report.cast_performance;
  const castItems: CastPerformanceItem[] = castAnalysis?.cast_items || [];

  if (!castAnalysis && castItems.length === 0) {
    return null;
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return "text-slate-400 bg-slate-800/60 border-slate-700/50";
    if (score >= 8.0) return "text-emerald-400 bg-emerald-950/60 border-emerald-500/30";
    if (score >= 6.0) return "text-amber-400 bg-amber-950/60 border-amber-500/30";
    return "text-crimson-400 bg-crimson-950/60 border-crimson-500/30";
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "HIGH":
        return <Badge variant="neural" className="text-[10px] uppercase">High Evidence</Badge>;
      case "MEDIUM":
        return <Badge variant="gold" className="text-[10px] uppercase">Moderate Evidence</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase">Directional Evidence</Badge>;
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            <span>Cast & Performance Intelligence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evidence-grounded acting metrics, character consistency, and scene impact evaluations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getConfidenceBadge(castAnalysis?.confidence)}
          <span className="text-xs font-mono text-slate-400 bg-cinematic-900/80 px-2.5 py-1 rounded-full border border-white/5">
            {castItems.length} Actor{castItems.length !== 1 ? "s" : ""} Analyzed
          </span>
        </div>
      </div>

      {/* Overall Assessment Summary */}
      {castAnalysis?.overall_cast_assessment && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-gold-500/10 via-cinematic-900/80 to-neural-500/10 border border-gold-500/20 text-sm text-slate-200 leading-relaxed">
          <div className="flex items-center gap-2 mb-1.5 font-semibold text-gold-300 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ensemble Synthesis</span>
          </div>
          {castAnalysis.overall_cast_assessment}
        </div>
      )}

      {/* Actor Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {castItems.map((item, idx) => {
          const scores = item.scores || {};
          const scoreEntries: { label: string; val: number | null | undefined }[] = [
            { label: "Acting Craft", val: scores.acting_score },
            { label: "Emotional Connect", val: scores.emotional_connect_score },
            { label: "Dialogue Delivery", val: scores.dialogue_delivery_score },
            { label: "Character Consistency", val: scores.character_consistency_score },
            { label: "Scene Impact", val: scores.scene_impact_score },
            { label: "Character Arc", val: scores.character_arc_score },
            { label: "Ensemble Chemistry", val: scores.chemistry_score },
          ].filter((s) => s.val != null);

          return (
            <div
              key={`${item.actor_name}-${idx}`}
              className="p-5 rounded-xl bg-cinematic-950/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Card Header: Actor Image, Name, Role, Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.actor_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gold-500/30 shadow-md shrink-0 bg-cinematic-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-cinematic-900 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                        <Users className="w-5 h-5 text-gold-400/70" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{item.actor_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                          {item.role_category?.replace("_", " ") || "ROLE"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        as <span className="text-gold-300 font-semibold">{item.character_name}</span>
                      </p>
                    </div>
                  </div>
                  {item.overall_performance_score != null && (
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-right font-mono flex flex-col items-center justify-center min-w-[52px] ${getScoreColor(
                        item.overall_performance_score
                      )}`}
                    >
                      <span className="text-sm font-bold leading-none">
                        {item.overall_performance_score.toFixed(1)}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider opacity-70">/10</span>
                    </div>
                  )}
                </div>

                {/* Computer Vision Evidence Badges (Screen Time & Confidence) */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {item.screen_time_seconds != null && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cinematic-900 border border-white/10 text-slate-300">
                      ⏱️ Screen Time: <strong className="text-white">{Math.floor(item.screen_time_seconds / 60)}m {Math.round(item.screen_time_seconds % 60)}s</strong>
                    </span>
                  )}
                  {item.scene_count != null && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cinematic-900 border border-white/10 text-slate-300">
                      🎬 {item.scene_count} Identified Scenes
                    </span>
                  )}
                  {item.identity_confidence != null && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neural-500/10 border border-neural-500/30 text-neural-300">
                      CV Match: {(item.identity_confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Screen Presence & Character Arc Brief */}
                {item.screen_presence && (
                  <p className="text-xs text-slate-300 bg-cinematic-900/60 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                    {item.screen_presence}
                  </p>
                )}

                {/* Granular Dimension Score Bars */}
                {scoreEntries.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Performance Dimensions
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {scoreEntries.map((sc, scIdx) => (
                        <div
                          key={scIdx}
                          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-cinematic-900/90 border border-white/5"
                        >
                          <span className="text-slate-400 text-[11px] truncate">{sc.label}</span>
                          <span className="font-mono font-bold text-slate-200 ml-1">
                            {sc.val != null ? sc.val.toFixed(1) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong Moments */}
                {item.strong_moments && item.strong_moments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Standout Sequences</span>
                    </span>
                    <div className="space-y-1">
                      {item.strong_moments.map((mom, mIdx) => (
                        <div
                          key={mIdx}
                          className="text-xs p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-slate-300 flex items-start gap-2"
                        >
                          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded shrink-0">
                            {mom.timestamp_start} - {mom.timestamp_end}
                          </span>
                          <span className="text-[11px] leading-relaxed">
                            {mom.reason || mom.evidence?.[0] || "Standout dramatic execution."}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Moments */}
                {item.weak_moments && item.weak_moments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Growth Areas / Vulnerable Beats</span>
                    </span>
                    <div className="space-y-1">
                      {item.weak_moments.map((mom, mIdx) => (
                        <div
                          key={mIdx}
                          className="text-xs p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-slate-300 flex items-start gap-2"
                        >
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded shrink-0">
                            {mom.timestamp_start} - {mom.timestamp_end}
                          </span>
                          <span className="text-[11px] leading-relaxed">
                            {mom.reason || mom.evidence?.[0] || "Opportunities for stronger emotional calibration."}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Notes */}
                {item.improvement_notes && (
                  <div className="text-xs text-slate-400 italic pt-1 border-t border-white/5">
                    💡 <span className="font-medium text-slate-300">Director Note:</span> {item.improvement_notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
