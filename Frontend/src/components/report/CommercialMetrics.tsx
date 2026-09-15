import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { TrendingUp, AlertTriangle, Users, DollarSign, Layers } from "lucide-react";
import { Badge } from "../ui/Badge";

interface CommercialMetricsProps {
  report: FinalFilmIntelligenceReport;
}

export function CommercialMetrics({ report }: CommercialMetricsProps) {
  const comm = report.commercial_analysis;

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>ML Commercial Viability & Market Dynamics</span>
        </h3>
        <span className="text-xs text-emerald-400 font-mono">Engine: Scikit/XGBoost ML</span>
      </div>

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
          <h4 className="text-xs font-mono uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
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
            <Layers className="w-4 h-4 text-amber-400" />
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
