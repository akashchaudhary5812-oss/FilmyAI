"use client";

import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  Layers,
  Activity,
  Cpu,
  Percent,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface CommercialMetricsProps {
  report: FinalFilmIntelligenceReport;
}

export function CommercialMetrics({ report }: CommercialMetricsProps) {
  const comm = report.commercial_analysis;
  const rawMl = (report.raw_ml_predictions || {}) as {
    predicted_commercial_class?: string;
    predicted_commercial_score?: number;
    commercial_success_probability?: number;
    model_confidence?: number;
    class_probabilities?: Record<string, number>;
    important_contributing_factors?: Array<{ factor: string; impact: string }>;
    model_version?: string;
  };

  const predictedClass =
    rawMl.predicted_commercial_class ||
    report.executive_summary?.commercial_tier ||
    report.executive_summary?.commercial_verdict ||
    "Commercial Forecast";

  const commercialScore: number | null =
    rawMl.predicted_commercial_score ??
    report.executive_summary?.overall_film_rating ??
    null;

  const successProb =
    rawMl.commercial_success_probability !== undefined
      ? Math.round(rawMl.commercial_success_probability * 100)
      : null;

  const confidence: number | null =
    rawMl.model_confidence !== undefined
      ? Math.round(rawMl.model_confidence * 100)
      : null;

  const classProbs = rawMl.class_probabilities || {};
  const factors = rawMl.important_contributing_factors || [];

  // Color mapping for classes
  const getClassColor = (cls: string) => {
    const lower = cls.toLowerCase();
    if (lower.includes("super hit") || lower.includes("blockbuster")) {
      return {
        bg: "bg-purple-500/15 border-purple-500/40 text-purple-200",
        bar: "bg-gradient-to-r from-purple-500 to-indigo-500",
        badge: "border-purple-500/50 text-purple-200 bg-purple-950/60",
        glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      };
    }
    if (lower.includes("hit") && !lower.includes("average")) {
      return {
        bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
        bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
        badge: "border-emerald-500/50 text-emerald-200 bg-emerald-950/60",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      };
    }
    if (lower.includes("average") || lower.includes("moderate")) {
      return {
        bg: "bg-amber-500/15 border-amber-500/40 text-amber-200",
        bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
        badge: "border-amber-500/50 text-amber-200 bg-amber-950/60",
        glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      };
    }
    return {
      bg: "bg-rose-500/15 border-rose-500/40 text-rose-200",
      bar: "bg-gradient-to-r from-rose-600 to-rose-400",
      badge: "border-rose-500/50 text-rose-200 bg-rose-950/60",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    };
  };

  const activeColor = getClassColor(predictedClass);

  return (
    <div
      id="section-commercial"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>ML Commercial Viability & Market Dynamics</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Predictive Box Office Modeling, Demographic Reach & Financial Catalysts
            </p>
          </div>
        </div>

        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30 w-fit">
          <Cpu className="w-3.5 h-3.5" />
          <span>ML Engine: XGBoost Ensemble v{rawMl.model_version || "3.1"}</span>
        </span>
      </div>

      {/* Quantitative ML Metrics Dashboard Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-white/10 space-y-6 shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Primary Class Verdict */}
          <div className="p-4 sm:p-5 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Predicted Theatrical Tier
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-3.5 py-1.5 rounded-xl text-base font-black border uppercase font-display tracking-wide ${activeColor.badge} ${activeColor.glow}`}
              >
                {predictedClass}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block">
              Grounded in theatrical training corpus
            </span>
          </div>

          {/* Model Score (0.0 to 9.0) */}
          <div className="p-4 sm:p-5 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Commercial Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-display">
                {commercialScore !== null ? commercialScore.toFixed(2) : "—"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {commercialScore !== null ? "/ 9.0 max" : "Awaiting ML Data"}
              </span>
            </div>
            <div className="w-full bg-cinematic-850 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full ${activeColor.bar} rounded-full transition-all duration-700`}
                style={{
                  width: commercialScore !== null
                    ? `${Math.min(100, Math.max(5, (commercialScore / 9.0) * 100))}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          {/* Confidence & Success Probability */}
          <div className="p-4 sm:p-5 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Confidence & Success
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {confidence !== null ? `${confidence}%` : "—"}
              </span>
              {successProb !== null && (
                <span className="text-xs text-slate-300 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  Hit Prob: <strong className="text-emerald-400 font-bold">{successProb}%</strong>
                </span>
              )}
            </div>
            <div className="w-full bg-cinematic-850 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: confidence !== null ? `${confidence}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* Class Probability Distribution Bars */}
        {Object.keys(classProbs).length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-prime-400" />
              <span>Theatrical Category Probability Distribution</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(classProbs).map(([cat, prob]) => {
                const percentage = Math.round(Number(prob) * 100);
                const colors = getClassColor(cat);
                const isSelected = cat.toLowerCase() === predictedClass.toLowerCase();
                return (
                  <div
                    key={cat}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.badge} ring-1 ring-white/30 shadow-md`
                        : "bg-cinematic-950/60 border-white/5 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-bold text-slate-200">{cat}</span>
                      <span className={isSelected ? "font-black text-white" : "text-slate-400"}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-cinematic-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} rounded-full`}
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Model Decision Factors */}
        {factors.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-netflix-400" />
              <span>Feature Weight Diagnostics Driving ML Forecast</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {factors.map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-cinematic-950/70 border border-white/5 flex items-start gap-2.5 text-xs"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-100">{f.factor}:</span>{" "}
                    <span className="text-slate-300">{f.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Box Office Outlook */}
      {comm?.box_office_outlook && (
        <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-emerald-500/30 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
            <DollarSign className="w-4 h-4" />
            <span>Theatrical & Lifetime Box Office Outlook</span>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans">
            {comm.box_office_outlook}
          </p>
        </div>
      )}

      {/* Catalysts vs Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Drivers */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Primary Commercial Catalysts</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.primary_commercial_drivers?.map((driver, i) => (
              <span
                key={i}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"
              >
                {driver}
              </span>
            ))}
          </div>
        </div>

        {/* Key Risk Factors */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Theatrical Risk Factors</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.key_risk_factors?.map((risk, i) => (
              <span
                key={i}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200"
              >
                {risk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demographics & Franchise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/10">
        {/* Target Demographics */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2 font-bold">
            <Users className="w-4 h-4 text-prime-400" />
            <span>Target Audience Demographics</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.target_demographics?.map((demo, i) => (
              <span
                key={i}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-prime-950/30 border border-prime-500/30 text-prime-200"
              >
                {demo}
              </span>
            ))}
          </div>
        </div>

        {/* Franchise & Ancillary */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2 font-bold">
            <Layers className="w-4 h-4 text-gold-400" />
            <span>Franchise & Ancillary Potential</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {comm?.franchise_and_ancillary_potential ||
              "High merchandising, sequel, and international syndication potential."}
          </p>
        </div>
      </div>
    </div>
  );
}
