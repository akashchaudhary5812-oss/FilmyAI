"use client";

import React from "react";
import { FinalFilmIntelligenceReport, CastPerformanceItem } from "@/types/report";
import {
  Users,
  Star,
  Award,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  ScanFace,
  Quote,
} from "lucide-react";
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
    if (score >= 8.0) return "text-emerald-300 bg-emerald-950/80 border-emerald-500/40";
    if (score >= 6.0) return "text-amber-300 bg-amber-950/80 border-amber-500/40";
    return "text-rose-300 bg-rose-950/80 border-rose-500/40";
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "HIGH":
        return <Badge variant="neural" className="text-[10px] uppercase font-mono">High Empirical Evidence</Badge>;
      case "MEDIUM":
        return <Badge variant="gold" className="text-[10px] uppercase font-mono">Moderate Empirical Evidence</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-mono">Directional Evidence</Badge>;
    }
  };

  return (
    <div
      id="section-cast"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Cast & Performance Intelligence</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Empirical Acting Craft, Screen Presence, and Ensemble Synergy Evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {getConfidenceBadge(castAnalysis?.confidence)}
          <span className="text-xs font-mono text-slate-300 bg-cinematic-900/90 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
            {castItems.length} Talent{castItems.length !== 1 ? "s" : ""} Profiled
          </span>
        </div>
      </div>

      {/* Overall Assessment Summary */}
      {castAnalysis?.overall_cast_assessment && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-gold-500/10 via-cinematic-900/90 to-prime-500/10 border border-gold-500/25 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gold-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Ensemble Synthesis & Dynamic Chemistry</span>
          </div>
          <p className="text-sm sm:text-base text-slate-100 font-sans leading-relaxed">
            {castAnalysis.overall_cast_assessment}
          </p>
        </div>
      )}

      {/* Actor Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          // Get initials for fallback avatar
          const initials = item.actor_name
            ? item.actor_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "AC";

          return (
            <div
              key={`${item.actor_name}-${idx}`}
              className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-4">
                {/* Card Header: Actor Image, Name, Role, Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.actor_name}
                        className="w-14 h-14 rounded-2xl object-cover border border-gold-500/40 shadow-lg shrink-0 bg-cinematic-950"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-600/20 to-cinematic-950 border border-gold-500/30 flex items-center justify-center text-gold-400 font-display font-black text-lg shrink-0 shadow-md">
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base sm:text-lg font-sans">
                          {item.actor_name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono uppercase font-bold">
                          {item.role_category?.replace("_", " ") || "PRINCIPAL"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        portraying{" "}
                        <strong className="text-gold-300 font-semibold">{item.character_name}</strong>
                      </p>
                    </div>
                  </div>

                  {item.overall_performance_score != null && (
                    <div
                      className={`px-3 py-1.5 rounded-xl border text-center font-mono flex flex-col items-center justify-center min-w-[56px] shadow-sm ${getScoreColor(
                        item.overall_performance_score
                      )}`}
                    >
                      <span className="text-base font-black leading-none">
                        {item.overall_performance_score.toFixed(1)}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">
                        / 10
                      </span>
                    </div>
                  )}
                </div>

                {/* Computer Vision Evidence Badges */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                  {item.screen_time_seconds != null && (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cinematic-950/80 border border-white/10 text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-prime-400" />
                      <span>
                        Screen Time:{" "}
                        <strong className="text-white">
                          {Math.floor(item.screen_time_seconds / 60)}m{" "}
                          {Math.round(item.screen_time_seconds % 60)}s
                        </strong>
                      </span>
                    </span>
                  )}
                  {item.scene_count != null && (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cinematic-950/80 border border-white/10 text-slate-300">
                      🎬 {item.scene_count} Sequences
                    </span>
                  )}
                  {item.identity_confidence != null && (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-prime-500/10 border border-prime-500/30 text-prime-300 flex items-center gap-1">
                      <ScanFace className="w-3 h-3" />
                      CV Match: {(item.identity_confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Screen Presence & Character Arc Brief */}
                {item.screen_presence && (
                  <p className="text-xs sm:text-sm text-slate-200 bg-cinematic-950/70 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {item.screen_presence}
                  </p>
                )}

                {/* Granular Dimension Score Bars */}
                {scoreEntries.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Performance Dimension Matrix
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {scoreEntries.map((sc, scIdx) => (
                        <div
                          key={scIdx}
                          className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 text-[11px] truncate">{sc.label}</span>
                            <span className="font-bold text-slate-100 font-mono">
                              {sc.val != null ? sc.val.toFixed(1) : "—"}
                            </span>
                          </div>
                          {sc.val != null && (
                            <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full"
                                style={{ width: `${Math.min(100, (sc.val / 10) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong Moments */}
                {item.strong_moments && item.strong_moments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Standout Sequences</span>
                    </span>
                    <div className="space-y-1.5">
                      {item.strong_moments.map((mom, mIdx) => (
                        <div
                          key={mIdx}
                          className="text-xs p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/20 text-slate-200 flex items-start gap-2.5"
                        >
                          <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                            {mom.timestamp_start} – {mom.timestamp_end}
                          </span>
                          <span className="text-xs leading-relaxed">
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
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Growth Areas & Inconsistencies</span>
                    </span>
                    <div className="space-y-1.5">
                      {item.weak_moments.map((mom, mIdx) => (
                        <div
                          key={mIdx}
                          className="text-xs p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/20 text-slate-200 flex items-start gap-2.5"
                        >
                          <span className="font-mono text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0">
                            {mom.timestamp_start} – {mom.timestamp_end}
                          </span>
                          <span className="text-xs leading-relaxed">
                            {mom.reason || mom.evidence?.[0] || "Opportunities for tighter calibration."}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Notes */}
                {item.improvement_notes && (
                  <div className="p-3 rounded-xl bg-cinematic-950/80 border border-white/5 text-xs text-slate-300 italic pt-1 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-400 not-italic">
                      <Quote className="w-3 h-3" />
                      <span>Director Coaching Memo</span>
                    </div>
                    <p>{item.improvement_notes}</p>
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
