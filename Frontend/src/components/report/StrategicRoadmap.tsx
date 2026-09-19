"use client";

import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Lightbulb, Scissors, Megaphone, Film, Sparkles, CheckCircle2 } from "lucide-react";

interface StrategicRoadmapProps {
  report: FinalFilmIntelligenceReport;
}

export function StrategicRoadmap({ report }: StrategicRoadmapProps) {
  const strat = report.strategic_recommendations;

  return (
    <div
      id="section-strategy"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-md">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              Strategic Studio Recommendations
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Actionable Guidance for Post-Production, Positioning & Windowing
            </p>
          </div>
        </div>

        <span className="text-xs text-gold-400 font-mono bg-gold-950/40 px-3 py-1.5 rounded-xl border border-gold-500/30 shadow-sm">
          Executive Roadmap
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Post-Production Guidance */}
        <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/80 border border-white/10 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-netflix-400 flex items-center gap-2 font-bold">
            <Scissors className="w-4 h-4" />
            <span>Post-Production & Editorial Optimization</span>
          </h3>
          <ul className="space-y-3">
            {strat?.post_production_guidance?.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-netflix-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Marketing & Positioning */}
        <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/80 border border-white/10 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-prime-400 flex items-center gap-2 font-bold">
            <Megaphone className="w-4 h-4" />
            <span>Marketing Hooks & Theatrical Positioning</span>
          </h3>
          <ul className="space-y-3">
            {strat?.marketing_and_positioning?.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-prime-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Theatrical vs Streaming */}
      {strat?.theatrical_vs_streaming_recommendation && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cinematic-900 via-gold-950/20 to-cinematic-900 border border-gold-500/30 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 shrink-0 mt-0.5 shadow-md">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase tracking-widest text-gold-400 font-bold">
              Distribution Window Optimization (Theatrical vs OTT)
            </h4>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium font-sans">
              {strat.theatrical_vs_streaming_recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
