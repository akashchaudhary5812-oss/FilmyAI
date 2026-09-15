import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Lightbulb, Scissors, Megaphone, Film } from "lucide-react";

interface StrategicRoadmapProps {
  report: FinalFilmIntelligenceReport;
}

export function StrategicRoadmap({ report }: StrategicRoadmapProps) {
  const strat = report.strategic_recommendations;

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>Strategic Studio Recommendations</span>
        </h3>
        <span className="text-xs text-amber-400 font-mono">Actionable Guidance</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Post-Production Guidance */}
        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            <span>Post-Production Optimization</span>
          </h4>
          <ul className="space-y-2">
            {strat?.post_production_guidance?.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Marketing & Positioning */}
        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-neural-400 flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span>Marketing Hooks & Positioning</span>
          </h4>
          <ul className="space-y-2">
            {strat?.marketing_and_positioning?.map((item, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                <span className="text-neural-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Theatrical vs Streaming */}
      {strat?.theatrical_vs_streaming_recommendation && (
        <div className="p-4 rounded-xl bg-cinematic-900 border border-gold-500/20 flex items-start gap-3">
          <Film className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-gold-400 mb-1">
              Distribution Window Optimization
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {strat.theatrical_vs_streaming_recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
