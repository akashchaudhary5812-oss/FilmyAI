"use client";

import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import {
  Camera,
  Sun,
  Activity,
  Volume2,
  Film,
  Clock,
  Sliders,
  Layers,
  Sparkles,
  Eye,
  Radio,
} from "lucide-react";

interface CinematographySectionProps {
  report: FinalFilmIntelligenceReport;
}

export function CinematographySection({ report }: CinematographySectionProps) {
  const cin = report.cinematography_analysis;
  const highlights = report.key_scene_highlights || [];
  const rawVid = (report.raw_video_metrics || {}) as {
    duration_seconds?: number;
    resolution?: string;
    aspect_ratio?: string;
    total_scenes?: number;
    total_shots?: number;
    average_shot_length_sec?: number;
    cuts_per_minute?: number;
    pacing_rhythm?: string;
    predominant_shot_scale?: string;
    shot_scale_distribution?: Record<string, { count: number; percentage: number }>;
    predominant_lighting_style?: string;
    lighting_style_distribution?: Record<string, { count: number; percentage: number }>;
    audio_speech_activity?: string;
    engine_version?: string;
  };

  const durationFormatted = rawVid.duration_seconds
    ? `${Math.floor(rawVid.duration_seconds / 60)}m ${Math.round(
        rawVid.duration_seconds % 60
      )}s`
    : null;

  const shotDist = rawVid.shot_scale_distribution || {};
  const lightDist = rawVid.lighting_style_distribution || {};

  return (
    <div
      id="section-cinematography"
      className="p-6 sm:p-8 rounded-3xl glass-panel space-y-7 relative overflow-hidden border border-white/10 shadow-xl scroll-mt-24"
    >
      {/* Background radial glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-prime-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-prime-500/15 border border-prime-500/30 flex items-center justify-center text-prime-400 shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Multimodal Cinematography & Video Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deep Computer Vision, Shot Cadence & Acoustic Telemetry
            </p>
          </div>
        </div>

        <span className="text-xs text-prime-400 font-mono flex items-center gap-1.5 bg-prime-950/40 px-3 py-1 rounded-full border border-prime-500/30 w-fit">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>ML_VIDEO Engine v{rawVid.engine_version || "2.4"}</span>
        </span>
      </div>

      {/* Multimodal Video Telemetry Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-cinematic-900/90 border border-white/10 space-y-6 shadow-inner">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Duration & Resolution */}
          <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-1.5 hover:border-prime-500/30 transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-prime-400" />
              <span>Runtime / Canvas</span>
            </span>
            <div className="text-lg sm:text-xl font-bold text-white font-mono">
              {durationFormatted || "Analyzed"}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {rawVid.resolution || "1080p HD"} ({rawVid.aspect_ratio || "2.39:1 Scope"})
            </div>
          </div>

          {/* Shot Count & Scenes */}
          <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-1.5 hover:border-netflix-500/30 transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Layers className="w-3.5 h-3.5 text-netflix-400" />
              <span>Shots & Sequences</span>
            </span>
            <div className="text-lg sm:text-xl font-bold text-netflix-400 font-mono">
              {rawVid.total_shots ? `${rawVid.total_shots} Cuts` : "Multi-Scene"}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {rawVid.total_scenes || 1} Distinct Sequences
            </div>
          </div>

          {/* Average Shot Length (ASL) */}
          <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-1.5 hover:border-emerald-500/30 transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Editing Rhythm</span>
            </span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              {rawVid.average_shot_length_sec
                ? `${rawVid.average_shot_length_sec.toFixed(2)}s ASL`
                : "Dynamic ASL"}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {rawVid.cuts_per_minute
                ? `${rawVid.cuts_per_minute.toFixed(1)} cuts/min`
                : rawVid.pacing_rhythm || "Cinematic Cadence"}
            </div>
          </div>

          {/* Dominant Framing */}
          <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/5 space-y-1.5 hover:border-indigo-500/30 transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Visual Stance</span>
            </span>
            <div className="text-base sm:text-lg font-bold text-indigo-300 font-mono truncate">
              {rawVid.predominant_shot_scale || "Close & Medium"}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {rawVid.predominant_lighting_style || "Chiaroscuro / Dramatic"}
            </div>
          </div>
        </div>

        {/* Visual Distribution Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/10">
          {/* Shot Scale Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-bold">
                <Camera className="w-3.5 h-3.5 text-prime-400" />
                <span>Shot Scale Distribution</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">CV Spatial Map</span>
            </div>

            {Object.keys(shotDist).length > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(shotDist).map(([scale, data]) => (
                  <div key={scale} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-medium">{scale}</span>
                      <span className="text-prime-300 font-bold">
                        {data.percentage}%{" "}
                        <span className="text-slate-500 text-[10px]">({data.count})</span>
                      </span>
                    </div>
                    <div className="w-full bg-cinematic-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-prime-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-cinematic-950/60 border border-white/5 text-xs text-slate-400 font-mono">
                {rawVid.predominant_shot_scale
                  ? `Predominantly framed in ${rawVid.predominant_shot_scale}.`
                  : "Balanced composition across sequence keyframes."}
              </div>
            )}
          </div>

          {/* Lighting Style Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-bold">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Lighting & Atmospheric Profile</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Photometric Map</span>
            </div>

            {Object.keys(lightDist).length > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(lightDist).map(([style, data]) => (
                  <div key={style} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-medium">{style}</span>
                      <span className="text-amber-300 font-bold">
                        {data.percentage}%{" "}
                        <span className="text-slate-500 text-[10px]">({data.count})</span>
                      </span>
                    </div>
                    <div className="w-full bg-cinematic-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-cinematic-950/60 border border-white/5 text-xs text-slate-400 font-mono">
                {rawVid.predominant_lighting_style
                  ? `Atmospheric profile characterized by ${rawVid.predominant_lighting_style}.`
                  : "Consistent, professional cinematic lighting profile."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Cinematography Pillars Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Grammar & Style */}
        <div className="p-5 rounded-2xl bg-cinematic-900/80 border border-white/10 hover:border-netflix-500/30 transition-all space-y-2 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-netflix-400 font-bold">
            <Film className="w-4 h-4" />
            <span>Visual Grammar & Aesthetic</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {cin?.visual_style_overview ||
              "Robust visual language with dedicated palette and deliberate camera movement."}
          </p>
        </div>

        {/* Shot Composition & Framing */}
        <div className="p-5 rounded-2xl bg-cinematic-900/80 border border-white/10 hover:border-prime-500/30 transition-all space-y-2 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-prime-400 font-bold">
            <Eye className="w-4 h-4" />
            <span>Shot Composition & Mise-en-Scène</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {cin?.shot_composition_assessment ||
              "Framing actively guides audience gaze and reinforces character power dynamics."}
          </p>
        </div>

        {/* Lighting Schemes & Atmosphere */}
        <div className="p-5 rounded-2xl bg-cinematic-900/80 border border-white/10 hover:border-amber-500/30 transition-all space-y-2 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            <Sun className="w-4 h-4" />
            <span>Lighting Schemes & Mood</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {cin?.lighting_and_atmosphere ||
              "Controlled color temperatures and contrast ratios cultivate visceral narrative tension."}
          </p>
        </div>

        {/* Editing Rhythm & Pacing */}
        <div className="p-5 rounded-2xl bg-cinematic-900/80 border border-white/10 hover:border-emerald-500/30 transition-all space-y-2 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
            <Activity className="w-4 h-4" />
            <span>Editing Rhythm & Temporal Cadence</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {cin?.pacing_and_editing_rhythm ||
              "Shot durations calibrate smoothly between high-octane setpieces and reflective character moments."}
          </p>
        </div>
      </div>

      {/* Acoustic Profile & Speech Dynamics */}
      {cin?.soundscape_and_speech && (
        <div className="p-5 rounded-2xl bg-cinematic-900/90 border border-indigo-500/30 flex items-start gap-3.5 shadow-md">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
              Acoustic Profile, Score Integration & Speech Dynamics
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {cin.soundscape_and_speech}
            </p>
          </div>
        </div>
      )}

      {/* Key Scene Highlights */}
      {highlights.length > 0 && (
        <div className="pt-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-netflix-400" />
              <span>Extracted Keyframe Sequences & Pivotal Beats</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {highlights.length} Sequences Documented
            </span>
          </div>

          <div className="space-y-2.5">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-cinematic-900/70 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-netflix-500/15 text-netflix-400 font-mono font-bold border border-netflix-500/30 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {h.timestamp_range}
                  </span>
                  <span className="font-bold text-white text-sm font-sans">{h.shot_type}</span>
                </div>

                <div className="text-slate-300 md:text-right max-w-xl text-xs space-y-0.5">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase font-bold mr-1">
                      Visual:
                    </span>
                    {h.visual_significance}
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase font-bold mr-1">
                      Narrative:
                    </span>
                    {h.narrative_impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
