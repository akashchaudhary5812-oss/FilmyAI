import React, { useState } from "react";
import { FinalFilmIntelligenceReport, FilmHighPoint, FilmMediumPoint, FilmLowPoint } from "@/types/report";
import { Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "../ui/Badge";

interface ScenePointsSectionProps {
  report: FinalFilmIntelligenceReport;
}

export function ScenePointsSection({ report }: ScenePointsSectionProps) {
  const highPoints: FilmHighPoint[] = report.film_high_points || [];
  const mediumPoints: FilmMediumPoint[] = report.film_medium_points || [];
  const lowPoints: FilmLowPoint[] = report.film_low_points || [];

  const [activeTab, setActiveTab] = useState<"all" | "high" | "medium" | "low">("all");

  const totalPoints = highPoints.length + mediumPoints.length + lowPoints.length;
  if (totalPoints === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-400" />
            <span>Scene Performance Hierarchy</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic evidence-based classification of film sequences: Highs, Functional Beats, and Critical Growth Points
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-cinematic-950/80 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white/10 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({totalPoints})
          </button>
          <button
            onClick={() => setActiveTab("high")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeTab === "high"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-emerald-400/70 hover:text-emerald-300"
            }`}
          >
            Highs ({highPoints.length})
          </button>
          <button
            onClick={() => setActiveTab("medium")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeTab === "medium"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-amber-400/70 hover:text-amber-300"
            }`}
          >
            Functional ({mediumPoints.length})
          </button>
          <button
            onClick={() => setActiveTab("low")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeTab === "low"
                ? "bg-crimson-500/20 text-crimson-300 font-bold border border-crimson-500/30"
                : "text-crimson-400/70 hover:text-crimson-300"
            }`}
          >
            Vulnerabilities ({lowPoints.length})
          </button>
        </div>
      </div>

      {/* High Points List */}
      {(activeTab === "all" || activeTab === "high") && highPoints.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Cinematic High Points ({highPoints.length})</span>
          </div>

          <div className="space-y-3">
            {highPoints.map((pt, idx) => (
              <div
                key={`high-${idx}`}
                className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pt.timestamp_start} - {pt.timestamp_end}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {pt.scene_description || `High-Impact Sequence ${idx + 1}`}
                    </span>
                  </div>
                  {pt.scene_score != null && (
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-500/40 w-fit">
                      Score: {pt.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-cinematic-950/40 p-3 rounded-lg border border-white/5">
                  <strong className="text-emerald-300 font-mono text-[11px] uppercase tracking-wide block mb-1">
                    Why It Works:
                  </strong>
                  {pt.why_it_works}
                </p>

                {/* Granular Dimension Scores Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] font-mono">
                  {pt.story_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Story</span>
                      <span className="font-bold text-slate-200">{pt.story_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.screenplay_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Screenplay</span>
                      <span className="font-bold text-slate-200">{pt.screenplay_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.acting_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Acting</span>
                      <span className="font-bold text-slate-200">{pt.acting_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.cinematography_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Visual</span>
                      <span className="font-bold text-slate-200">{pt.cinematography_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.audio_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Sound</span>
                      <span className="font-bold text-slate-200">{pt.audio_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.emotional_strength != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Emotion</span>
                      <span className="font-bold text-slate-200">{pt.emotional_strength.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {pt.audience_impact && (
                  <div className="text-[11px] text-emerald-300 font-mono">
                    ✦ <span className="opacity-80 font-sans">{pt.audience_impact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium Points List */}
      {(activeTab === "all" || activeTab === "medium") && mediumPoints.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Functional / Moderate Sequences ({mediumPoints.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mediumPoints.map((pt, idx) => (
              <div
                key={`med-${idx}`}
                className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/25 hover:border-amber-500/40 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pt.timestamp_start} - {pt.timestamp_end}
                  </span>
                  {pt.scene_score != null && (
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {pt.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5 text-slate-300">
                  {pt.what_works && (
                    <p>
                      <strong className="text-slate-100 font-mono text-[10px] uppercase">Works:</strong>{" "}
                      {pt.what_works}
                    </p>
                  )}
                  {pt.what_is_average && (
                    <p className="text-slate-400">
                      <strong className="text-amber-300 font-mono text-[10px] uppercase">Average:</strong>{" "}
                      {pt.what_is_average}
                    </p>
                  )}
                  {pt.improvement_area && (
                    <p className="text-amber-200/90 italic text-[11px]">
                      💡 <span className="font-mono not-italic uppercase text-[10px] text-amber-400">Upgrade:</span>{" "}
                      {pt.improvement_area}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Points List */}
      {(activeTab === "all" || activeTab === "low") && lowPoints.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-crimson-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Critical Vulnerabilities & Weak Points ({lowPoints.length})</span>
          </div>

          <div className="space-y-3">
            {lowPoints.map((pt, idx) => (
              <div
                key={`low-${idx}`}
                className="p-4 rounded-xl bg-crimson-950/20 border border-crimson-500/30 hover:border-crimson-500/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-crimson-400 bg-crimson-950/80 px-2.5 py-1 rounded-md border border-crimson-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pt.timestamp_start} - {pt.timestamp_end}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {pt.scene_description || `Underperforming Beat ${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson-900/60 text-crimson-300 border border-crimson-500/30">
                      {pt.affected_category}
                    </span>
                  </div>
                  {pt.scene_score != null && (
                    <span className="font-mono text-xs font-bold text-crimson-400 bg-crimson-900/60 px-2.5 py-1 rounded-full border border-crimson-500/40 w-fit">
                      Score: {pt.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-cinematic-950/60 border border-crimson-500/20 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-crimson-400 font-bold block">
                      Primary Issue
                    </span>
                    <p className="text-slate-300 leading-relaxed">{pt.primary_issue}</p>
                    {pt.audience_effect && (
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        Impact on audience: {pt.audience_effect}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-cinematic-950/60 border border-neural-500/20 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-neural-400 font-bold block">
                      Recommended Fix
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {pt.recommendation || "Tighten editing and heighten dramatic pacing."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
