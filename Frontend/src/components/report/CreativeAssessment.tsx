"use client";

import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { CheckCircle2, AlertCircle, Compass, BookOpen } from "lucide-react";

interface CreativeAssessmentProps {
  report: FinalFilmIntelligenceReport;
}

export function CreativeAssessment({ report }: CreativeAssessmentProps) {
  const creative = report.creative_technical_assessment;

  return (
    <div
      id="section-creative"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-netflix-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-netflix-500/15 border border-netflix-500/30 flex items-center justify-center text-netflix-400 shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              Creative & Technical Critique
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              In-Depth SWOT Assessment & Screenplay Architecture Analysis
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono bg-cinematic-900/90 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
          Studio Creative Audit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/15 border border-emerald-500/30 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Artistic & Technical Strengths</span>
          </h3>
          <ul className="space-y-3">
            {creative?.key_strengths?.map((strength, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed font-sans">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Weaknesses */}
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-950/15 border border-rose-500/30 space-y-4 shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Vulnerabilities & Cautionary Areas</span>
          </h3>
          <ul className="space-y-3">
            {creative?.key_weaknesses?.map((weakness, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed font-sans">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {creative?.thematic_and_narrative_cohesion && (
        <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-white/10 space-y-2 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-prime-400 font-bold">
            <BookOpen className="w-4 h-4" />
            <span>Thematic & Narrative Cohesion</span>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
            {creative.thematic_and_narrative_cohesion}
          </p>
        </div>
      )}
    </div>
  );
}
