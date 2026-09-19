"use client";

import React, { useState } from "react";
import {
  FinalFilmIntelligenceReport,
  FilmHighPoint,
  FilmMediumPoint,
  FilmLowPoint,
} from "@/types/report";
import {
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Lightbulb,
  CheckCircle2,
  Wrench,
  ShieldAlert,
} from "lucide-react";

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
    <div
      id="section-scene-hierarchy"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Scene Performance Hierarchy</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Algorithmic Classification: Cinematic Peaks, Functional Beats & Polish Vectors
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-cinematic-900/90 p-1.5 rounded-2xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "all"
                ? "bg-white/10 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({totalPoints})
          </button>
          <button
            onClick={() => setActiveTab("high")}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
              activeTab === "high"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm"
                : "text-emerald-400/80 hover:text-emerald-300"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Highs ({highPoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("medium")}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
              activeTab === "medium"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-sm"
                : "text-amber-400/80 hover:text-amber-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Functional ({mediumPoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("low")}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
              activeTab === "low"
                ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 shadow-sm"
                : "text-rose-400/80 hover:text-rose-300"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vulnerabilities ({lowPoints.length})</span>
          </button>
        </div>
      </div>

      {/* High Points List */}
      {(activeTab === "all" || activeTab === "high") && highPoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Cinematic Master Sequences & High Points ({highPoints.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase">score ≥ 8.0/10</span>
          </div>

          <div className="space-y-4">
            {highPoints.map((pt, idx) => (
              <div
                key={`high-${idx}`}
                className="p-5 rounded-2xl bg-emerald-950/15 border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {pt.timestamp_start} – {pt.timestamp_end}
                    </span>
                    <h3 className="font-bold text-white text-base font-sans">
                      {pt.scene_description || `Master Sequence ${idx + 1}`}
                    </h3>
                  </div>

                  {pt.scene_score != null && (
                    <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/40 w-fit flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Score: {pt.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                {/* Why it works */}
                <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1">
                  <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Why It Captivates Audiences</span>
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {pt.why_it_works}
                  </p>
                </div>

                {/* Granular Dimension Scores Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
                  {pt.story_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Story</span>
                      <span className="font-bold text-slate-100">{pt.story_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.screenplay_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Screenplay</span>
                      <span className="font-bold text-slate-100">
                        {pt.screenplay_strength.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {pt.acting_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Acting</span>
                      <span className="font-bold text-slate-100">{pt.acting_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.cinematography_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Visual</span>
                      <span className="font-bold text-slate-100">
                        {pt.cinematography_strength.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {pt.audio_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Sound</span>
                      <span className="font-bold text-slate-100">{pt.audio_strength.toFixed(1)}</span>
                    </div>
                  )}
                  {pt.emotional_strength != null && (
                    <div className="p-2 rounded-xl bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Emotion</span>
                      <span className="font-bold text-slate-100">
                        {pt.emotional_strength.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {pt.audience_impact && (
                  <div className="text-xs text-emerald-300 font-mono flex items-center gap-1.5 pt-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-sans text-slate-300">
                      <strong>Audience Impact:</strong> {pt.audience_impact}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium Points List */}
      {(activeTab === "all" || activeTab === "medium") && mediumPoints.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Functional & Transitional Sequences ({mediumPoints.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase">score 6.0 – 7.9/10</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediumPoints.map((pt, idx) => (
              <div
                key={`med-${idx}`}
                className="p-5 rounded-2xl bg-amber-950/15 border border-amber-500/25 hover:border-amber-500/40 transition-all space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {pt.timestamp_start} – {pt.timestamp_end}
                    </span>
                    {pt.scene_score != null && (
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        {pt.scene_score.toFixed(1)} / 10
                      </span>
                    )}
                  </div>

                  <div className="text-xs space-y-2 text-slate-300">
                    {pt.what_works && (
                      <div className="p-3 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-0.5">
                        <span className="text-slate-300 font-mono text-[10px] uppercase font-bold block">
                          Works Well:
                        </span>
                        <p className="text-slate-200">{pt.what_works}</p>
                      </div>
                    )}
                    {pt.what_is_average && (
                      <div className="p-3 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-0.5">
                        <span className="text-amber-300 font-mono text-[10px] uppercase font-bold block">
                          Room for Elevation:
                        </span>
                        <p className="text-slate-300">{pt.what_is_average}</p>
                      </div>
                    )}
                  </div>
                </div>

                {pt.improvement_area && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-amber-400 mb-0.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Suggested Upgrade</span>
                    </div>
                    <p className="leading-relaxed">{pt.improvement_area}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Points List */}
      {(activeTab === "all" || activeTab === "low") && lowPoints.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Vulnerabilities & Weak Points ({lowPoints.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase">score &lt; 6.0/10</span>
          </div>

          <div className="space-y-4">
            {lowPoints.map((pt, idx) => (
              <div
                key={`low-${idx}`}
                className="p-5 rounded-2xl bg-rose-950/15 border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-rose-300 bg-rose-950/80 px-3 py-1 rounded-lg border border-rose-500/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {pt.timestamp_start} – {pt.timestamp_end}
                    </span>
                    <h3 className="font-bold text-white text-base font-sans">
                      {pt.scene_description || `Underperforming Beat ${idx + 1}`}
                    </h3>
                    {pt.affected_category && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-900/60 text-rose-200 border border-rose-500/30 uppercase">
                        {pt.affected_category}
                      </span>
                    )}
                  </div>

                  {pt.scene_score != null && (
                    <span className="font-mono text-xs font-bold text-rose-300 bg-rose-900/60 px-3 py-1 rounded-full border border-rose-500/40 w-fit">
                      Score: {pt.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Primary Issue */}
                  <div className="p-4 rounded-xl bg-cinematic-950/70 border border-rose-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Diagnostic Issue</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed text-sm">{pt.primary_issue}</p>
                    {pt.audience_effect && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
                        Audience Drop Risk: {pt.audience_effect}
                      </p>
                    )}
                  </div>

                  {/* Recommended Fix */}
                  <div className="p-4 rounded-xl bg-cinematic-950/70 border border-prime-500/20 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-prime-400 font-bold flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Studio Recommended Fix</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed text-sm">
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
