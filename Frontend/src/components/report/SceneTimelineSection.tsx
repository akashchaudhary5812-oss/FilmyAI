import React from "react";
import { FinalFilmIntelligenceReport, SceneTimelineEntry } from "@/types/report";
import { BarChart3, Clock, Film, Activity, Volume2, ShieldCheck, Layers } from "lucide-react";
import { Badge } from "../ui/Badge";

interface SceneTimelineSectionProps {
  report: FinalFilmIntelligenceReport;
}

export function SceneTimelineSection({ report }: SceneTimelineSectionProps) {
  const timeline = report.scene_performance_timeline;
  const entries: SceneTimelineEntry[] = timeline?.entries || [];

  if (!timeline || entries.length === 0) {
    return null;
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return "text-slate-400 bg-slate-800/60 border-slate-700/50";
    if (score >= 8.0) return "text-emerald-400 bg-emerald-950/60 border-emerald-500/30";
    if (score >= 6.0) return "text-amber-400 bg-amber-950/60 border-amber-500/30";
    return "text-crimson-400 bg-crimson-950/60 border-crimson-500/30";
  };

  const getBarHeight = (score: number | null | undefined) => {
    if (score == null) return "20%";
    return `${Math.max(15, Math.min(100, score * 10))}%`;
  };

  const getBarColor = (score: number | null | undefined) => {
    if (score == null) return "bg-slate-600";
    if (score >= 8.0) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (score >= 6.0) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-crimson-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  };

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neural-400" />
            <span>Scene Performance Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-scene evaluation mapped continuously from opening sequence to resolution
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          {timeline.average_scene_score != null && (
            <span className="px-3 py-1 rounded-full bg-cinematic-900 border border-white/10 text-slate-300">
              Avg Score: <strong className="text-gold-400">{timeline.average_scene_score.toFixed(1)}</strong>/10
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-cinematic-900 border border-white/10 text-slate-400">
            {timeline.total_scenes_evaluated || entries.length} Scenes
          </span>
        </div>
      </div>

      {/* Visual Timeline Waveform / Bar Chart */}
      <div className="p-4 rounded-xl bg-cinematic-950/90 border border-white/10 space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
          Chronological Scene Trajectory & Energy Distribution
        </span>
        <div className="h-28 flex items-end gap-1 sm:gap-2 pt-4 px-2 border-b border-white/10">
          {entries.map((entry, idx) => (
            <div
              key={`bar-${idx}`}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                <div className="p-2 rounded-lg bg-cinematic-900 text-[10px] font-mono border border-white/20 shadow-xl whitespace-nowrap space-y-0.5">
                  <div className="font-bold text-white">Scene {idx + 1} ({entry.timestamp_range})</div>
                  <div className="text-gold-400">Score: {entry.scene_score != null ? entry.scene_score.toFixed(1) : "N/A"}/10</div>
                  {entry.dominant_category && <div className="text-slate-400">Category: {entry.dominant_category}</div>}
                  {entry.pacing_label && <div className="text-slate-400">Pacing: {entry.pacing_label}</div>}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{ height: getBarHeight(entry.scene_score) }}
                className={`w-full max-w-[28px] rounded-t-sm transition-all group-hover:opacity-100 opacity-85 ${getBarColor(
                  entry.scene_score
                )}`}
              />
              <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                S{idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Granular Scene Cards Strip */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
          Sequence-by-Sequence Telemetry Breakdown
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map((entry, idx) => (
            <div
              key={`card-${idx}`}
              className="p-3.5 rounded-xl bg-cinematic-950/60 border border-white/10 hover:border-white/20 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Scene {idx + 1}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neural-400" />
                    {entry.timestamp_range}
                  </span>
                </div>
                {entry.scene_score != null && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(
                      entry.scene_score
                    )}`}
                  >
                    {entry.scene_score.toFixed(1)}/10
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="p-1.5 rounded bg-cinematic-900/60 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Category</span>
                  <span className="truncate block font-semibold text-slate-200">
                    {entry.dominant_category}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-cinematic-900/60 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Pacing</span>
                  <span className="truncate block font-semibold text-slate-200">
                    {entry.pacing_label || "Balanced"}
                  </span>
                </div>
              </div>

              {(entry.visual_evidence || entry.acoustic_evidence) && (
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-white/5">
                  {entry.visual_evidence && (
                    <div className="flex items-start gap-1.5 leading-snug">
                      <Film className="w-3 h-3 text-neural-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{entry.visual_evidence}</span>
                    </div>
                  )}
                  {entry.acoustic_evidence && (
                    <div className="flex items-start gap-1.5 leading-snug">
                      <Volume2 className="w-3 h-3 text-gold-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{entry.acoustic_evidence}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
