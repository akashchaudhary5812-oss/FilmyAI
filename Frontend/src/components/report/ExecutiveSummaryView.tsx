import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface ExecutiveSummaryViewProps {
  report: FinalFilmIntelligenceReport;
}

export function ExecutiveSummaryView({ report }: ExecutiveSummaryViewProps) {
  const summary = report.executive_summary;

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-netflix-400" />
          <span>Executive Intelligence Summary</span>
        </h3>
        <span className="text-xs text-netflix-400 font-mono font-semibold">
          {summary?.commercial_verdict}
        </span>
      </div>

      <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
        {summary?.key_thesis}
      </p>

      {/* Story Provenance */}
      <div className="mt-4 p-4 rounded-xl bg-cinematic-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Script Origin: {report.story_provenance?.script_source || "Screenplay Excerpt"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-neural-400" />
          <span>Synopsis Origin: {report.story_provenance?.summary_source || "Studio Dossier"}</span>
        </div>
      </div>
    </div>
  );
}
