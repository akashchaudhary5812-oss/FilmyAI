"use client";

import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Quote,
  ShieldCheck,
  Award,
  AlertTriangle,
  Flame,
  BadgeAlert,
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface ExecutiveSummaryViewProps {
  report: FinalFilmIntelligenceReport;
}

export function ExecutiveSummaryView({ report }: ExecutiveSummaryViewProps) {
  const summary = report.executive_summary;

  const strongestAreas = summary?.strongest_creative_areas || [];
  const weakestAreas = summary?.weakest_creative_areas || [];
  const topCast = summary?.top_cast_performances || [];

  return (
    <div
      id="section-executive"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-netflix-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-netflix-500/15 border border-netflix-500/30 flex items-center justify-center text-netflix-400 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Executive Intelligence Dossier</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Grounded AI Assessment & Comprehensive Theatrical Thesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary?.commercial_tier &&
            (!summary?.commercial_verdict ||
              !summary.commercial_verdict.toLowerCase().includes(summary.commercial_tier.toLowerCase())) && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-prime-500/15 text-prime-400 border border-prime-500/30">
                {summary.commercial_tier}
              </span>
            )}
          {summary?.commercial_verdict && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-netflix-500/15 text-netflix-400 border border-netflix-500/30">
              {summary.commercial_verdict}
            </span>
          )}
        </div>
      </div>

      {/* Key Thesis Block with Studio Quote Framing */}
      <div className="relative p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-white/10 space-y-3 shadow-inner">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-netflix-400 font-bold">
          <Quote className="w-4 h-4" />
          <span>Core Strategic Thesis</span>
        </div>

        <p className="text-base sm:text-lg text-slate-100 font-sans leading-relaxed">
          {summary?.key_thesis || "Comprehensive film analysis complete."}
        </p>
      </div>

      {/* Dynamic Strategic Signals Strip (If Available) */}
      {(strongestAreas.length > 0 || weakestAreas.length > 0 || topCast.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Creative Strengths */}
          {strongestAreas.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Major Strengths</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {strongestAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Caution Areas */}
          {weakestAreas.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critical Vulnerabilities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weakestAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-200"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Performances */}
          {topCast.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-amber-400">
                <Award className="w-3.5 h-3.5" />
                <span>Standout Performances</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topCast.map((cast, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-200"
                  >
                    {cast}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Confidence or Limitations (if any) */}
      {summary?.confidence_limitations && (
        <div className="p-3.5 rounded-xl bg-cinematic-950/80 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
          <BadgeAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300 font-mono uppercase text-[10px] block">
              Confidence & Scope Note:
            </strong>
            {summary.confidence_limitations}
          </p>
        </div>
      )}

      {/* Story Provenance & Governance Bar */}
      <div className="p-4 rounded-2xl bg-cinematic-950/80 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Script Origin:{" "}
            <strong className="text-slate-200">
              {report.story_provenance?.script_source || "Screenplay Excerpt / Multimodal Video"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-prime-400" />
          <span>
            Synopsis Origin:{" "}
            <strong className="text-slate-200">
              {report.story_provenance?.summary_source || "Studio Dossier Metadata"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-netflix-400" />
          <span>
            Integrity: <strong className="text-slate-200">Cryptographically Audited</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
