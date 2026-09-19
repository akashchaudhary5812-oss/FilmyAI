import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { CheckCircle2, AlertCircle, Compass } from "lucide-react";

interface CreativeAssessmentProps {
  report: FinalFilmIntelligenceReport;
}

export function CreativeAssessment({ report }: CreativeAssessmentProps) {
  const creative = report.creative_technical_assessment;

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Compass className="w-5 h-5 text-netflix-400" />
          <span>Creative & Technical Critique</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">SWOT Assessment</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Artistic & Technical Strengths</span>
          </h4>
          <ul className="space-y-2">
            {creative?.key_strengths?.map((strength, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Weaknesses */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Vulnerabilities & Cautionary Areas</span>
          </h4>
          <ul className="space-y-2">
            {creative?.key_weaknesses?.map((weakness, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {creative?.thematic_and_narrative_cohesion && (
        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1.5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Thematic & Narrative Cohesion
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">
            {creative.thematic_and_narrative_cohesion}
          </p>
        </div>
      )}
    </div>
  );
}
