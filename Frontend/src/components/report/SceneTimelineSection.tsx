"use client";

import React, { useState } from "react";
import { FinalFilmIntelligenceReport, SceneTimelineEntry } from "@/types/report";
import {
  BarChart3,
  Clock,
  Film,
  Volume2,
  Sparkles,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

interface SceneTimelineSectionProps {
  report: FinalFilmIntelligenceReport;
}

export function SceneTimelineSection({ report }: SceneTimelineSectionProps) {
  const timeline = report.scene_performance_timeline;
  const entries: SceneTimelineEntry[] = timeline?.entries || [];
  const [selectedScene, setSelectedScene] = useState<number | null>(null);

  if (!timeline || entries.length === 0) {
    return null;
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return "text-slate-400 bg-slate-800/60 border-slate-700/50";
    if (score >= 8.0) return "text-emerald-300 bg-emerald-950/80 border-emerald-500/40";
    if (score >= 6.0) return "text-amber-300 bg-amber-950/80 border-amber-500/40";
    return "text-rose-300 bg-rose-950/80 border-rose-500/40";
  };

  const getBarHeight = (score: number | null | undefined) => {
    if (score == null) return "20%";
    return `${Math.max(15, Math.min(100, score * 10))}%`;
  };

  const getBarGradient = (score: number | null | undefined) => {
    if (score == null) return "from-slate-600 to-slate-800";
    if (score >= 8.0) return "from-emerald-400 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]";
    if (score >= 6.0) return "from-amber-400 to-yellow-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
    return "from-rose-500 to-red-700 shadow-[0_0_12px_rgba(239,68,68,0.4)]";
  };

  return (
    <div
      id="section-timeline"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-prime-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-prime-500/15 border border-prime-500/30 flex items-center justify-center text-prime-400 shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Scene Performance Timeline & Energy Curve</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Continuous Chronological Sequence Mapping from Opening Beat to Climax
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {timeline.average_scene_score != null && (
            <span className="px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 text-slate-300 shadow-sm flex items-center gap-1.5">
              <span>Avg Score:</span>
              <strong className="text-amber-400 font-bold">
                {timeline.average_scene_score.toFixed(1)}
              </strong>
              <span className="text-slate-500">/ 10</span>
            </span>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 text-slate-400 shadow-sm">
            {timeline.total_scenes_evaluated || entries.length} Evaluated Scenes
          </span>
        </div>
      </div>

      {/* Visual Timeline Waveform / Bar Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-white/10 space-y-4 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-prime-400" />
            <span>Interactive Narrative Energy Distribution (Click bar to isolate scene)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Left-to-Right Chronology</span>
        </div>

        <div className="h-36 flex items-end gap-1.5 sm:gap-2 pt-6 px-3 border-b border-white/10 relative">
          {entries.map((entry, idx) => {
            const isSelected = selectedScene === idx;
            return (
              <button
                key={`bar-${idx}`}
                onClick={() => setSelectedScene(isSelected ? null : idx)}
                className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end cursor-pointer focus:outline-none"
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-30 pointer-events-none transition-all">
                  <div className="p-2.5 rounded-xl bg-cinematic-950 text-[11px] font-mono border border-white/20 shadow-2xl whitespace-nowrap space-y-0.5 text-left min-w-[140px]">
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>Scene {idx + 1}</span>
                      <span className="text-slate-400 text-[10px]">({entry.timestamp_range})</span>
                    </div>
                    <div className="text-amber-400 font-bold">
                      Score: {entry.scene_score != null ? entry.scene_score.toFixed(1) : "N/A"} / 10
                    </div>
                    {entry.dominant_category && (
                      <div className="text-slate-300 text-[10px]">
                        Category: {entry.dominant_category}
                      </div>
                    )}
                    {entry.pacing_label && (
                      <div className="text-slate-300 text-[10px]">Pacing: {entry.pacing_label}</div>
                    )}
                  </div>
                </div>

                {/* Score Bar */}
                <div
                  style={{ height: getBarHeight(entry.scene_score) }}
                  className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 bg-gradient-to-t ${getBarGradient(
                    entry.scene_score
                  )} ${
                    isSelected
                      ? "ring-2 ring-white scale-105 opacity-100"
                      : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                />

                <span
                  className={`text-[10px] font-mono transition-colors truncate w-full text-center ${
                    isSelected ? "text-white font-bold" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  S{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sequence Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-netflix-400" />
            <span>
              {selectedScene !== null
                ? `Isolated Sequence Inspection (Scene ${selectedScene + 1})`
                : "Sequence-by-Sequence Deep Diagnostics"}
            </span>
          </span>

          {selectedScene !== null && (
            <button
              onClick={() => setSelectedScene(null)}
              className="text-xs font-mono text-netflix-400 hover:text-netflix-300 underline"
            >
              Show All Scenes ({entries.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(selectedScene !== null ? [entries[selectedScene]] : entries).map((entry, originalIdx) => {
            const idx = selectedScene !== null ? selectedScene : originalIdx;
            return (
              <div
                key={`card-${idx}`}
                className={`p-4 sm:p-5 rounded-2xl bg-cinematic-900/80 border transition-all space-y-3 shadow-sm ${
                  selectedScene === idx
                    ? "border-prime-500 ring-1 ring-prime-500/50 bg-cinematic-900"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                      Scene {idx + 1}
                    </span>
                    <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-prime-400" />
                      {entry.timestamp_range}
                    </span>
                  </div>

                  {entry.scene_score != null && (
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${getScoreColor(
                        entry.scene_score
                      )}`}
                    >
                      {entry.scene_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block">Category</span>
                    <span className="truncate block font-semibold text-slate-200">
                      {entry.dominant_category || "Dramatic Beat"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block">Pacing Cadence</span>
                    <span className="truncate block font-semibold text-slate-200">
                      {entry.pacing_label || "Balanced"}
                    </span>
                  </div>
                </div>

                {(entry.visual_evidence || entry.acoustic_evidence) && (
                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/5">
                    {entry.visual_evidence && (
                      <div className="flex items-start gap-2">
                        <Film className="w-3.5 h-3.5 text-prime-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{entry.visual_evidence}</span>
                      </div>
                    )}
                    {entry.acoustic_evidence && (
                      <div className="flex items-start gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{entry.acoustic_evidence}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
