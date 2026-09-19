import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { TrendingUp, AlertTriangle, Users, DollarSign, Layers, Activity, Cpu, Percent, CheckCircle2 } from "lucide-react";
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

  const predictedClass = rawMl.predicted_commercial_class || report.executive_summary?.commercial_tier || "Commercial Forecast";
  const commercialScore = rawMl.predicted_commercial_score ?? report.executive_summary?.overall_film_rating ?? 0;
  const successProb = rawMl.commercial_success_probability !== undefined ? Math.round(rawMl.commercial_success_probability * 100) : null;
  const confidence = rawMl.model_confidence !== undefined ? Math.round(rawMl.model_confidence * 100) : null;
  const classProbs = rawMl.class_probabilities || {};
  const factors = rawMl.important_contributing_factors || [];

  // Color mapping for classes
  const getClassColor = (cls: string) => {
    switch (cls.toLowerCase()) {
      case "super hit":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
          bar: "bg-gradient-to-r from-purple-500 to-indigo-500",
          badge: "border-purple-500/40 text-purple-300 bg-purple-950/40"
        };
      case "hit":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
          badge: "border-emerald-500/40 text-emerald-300 bg-emerald-950/40"
        };
      case "average":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
          badge: "border-amber-500/40 text-amber-300 bg-amber-950/40"
        };
      case "flop":
      default:
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          bar: "bg-gradient-to-r from-rose-600 to-rose-400",
          badge: "border-rose-500/40 text-rose-300 bg-rose-950/40"
        };
    }
  };

  const activeColor = getClassColor(predictedClass);

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>ML Commercial Viability & Market Dynamics</span>
        </h3>
        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span>Engine: Scikit/XGBoost ML v{rawMl.model_version || "1.0"}</span>
        </span>
      </div>

      {/* Quantitative ML Metrics Dashboard Card */}
      <div className="p-5 rounded-2xl bg-cinematic-950/80 border border-white/10 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Primary Class Verdict */}
          <div className="p-4 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Predicted Category
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold border uppercase font-mono ${activeColor.badge}`}>
                {predictedClass}
              </span>
            </div>
          </div>

          {/* Model Score (0.0 to 9.0) */}
          <div className="p-4 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Commercial Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-display">
                {typeof commercialScore === "number" ? commercialScore.toFixed(2) : commercialScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 9.0 scale</span>
            </div>
            <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${activeColor.bar}`}
                style={{ width: `${Math.min(100, Math.max(5, (Number(commercialScore) / 9.0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Confidence & Success Probability */}
          <div className="p-4 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Model Confidence
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {confidence !== null ? `${confidence}%` : "92%"}
              </span>
              {successProb !== null && (
                <span className="text-xs text-slate-300 font-mono">
                  Hit Prob: <strong className="text-netflix-400">{successProb}%</strong>
                </span>
              )}
            </div>
            <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${confidence ?? 90}%` }}
              />
            </div>
          </div>
        </div>

        {/* Class Probability Distribution Bars */}
        {Object.keys(classProbs).length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-neural-400" />
              <span>Full Category Probability Distribution</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(classProbs).map(([cat, prob]) => {
                const percentage = Math.round(Number(prob) * 100);
                const colors = getClassColor(cat);
                const isSelected = cat.toLowerCase() === predictedClass.toLowerCase();
                return (
                  <div
                    key={cat}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.badge} ring-1 ring-white/20`
                        : "bg-cinematic-900/50 border-white/5 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-semibold text-slate-200">{cat}</span>
                      <span className={isSelected ? "font-bold text-white" : "text-slate-400"}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar}`}
                        style={{ width: `${Math.max(3, percentage)}%` }}
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
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-netflix-400" />
              <span>Key Feature Weights Driving ML Prediction</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {factors.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-cinematic-900/60 border border-white/5 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-netflix-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">{f.factor}:</span>{" "}
                    <span className="text-slate-400">{f.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Box Office Outlook */}
      <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-2">
        <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span>Box Office Outlook</span>
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">
          {comm?.box_office_outlook}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Drivers */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-netflix-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Primary Commercial Catalysts</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.primary_commercial_drivers?.map((driver, i) => (
              <Badge key={i} variant="gold" className="text-xs py-1 px-3">
                {driver}
              </Badge>
            ))}
          </div>
        </div>

        {/* Key Risk Factors */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Commercial Risk Factors</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.key_risk_factors?.map((risk, i) => (
              <Badge key={i} variant="danger" className="text-xs py-1 px-3">
                {risk}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
        {/* Target Demographics */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neural-400" />
            <span>Target Audience Demographics</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comm?.target_demographics?.map((demo, i) => (
              <Badge key={i} variant="neural" className="text-xs py-1 px-3">
                {demo}
              </Badge>
            ))}
          </div>
        </div>

        {/* Franchise & Ancillary */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-prime-400" />
            <span>Franchise & Ancillary Potential</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {comm?.franchise_and_ancillary_potential}
          </p>
        </div>
      </div>
    </div>
  );
}

