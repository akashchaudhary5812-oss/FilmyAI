import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Camera, Sun, Activity, Volume2, Film, Clock, Monitor, Sliders, Layers, Sparkles } from "lucide-react";
import { Badge } from "../ui/Badge";

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
    ? `${Math.floor(rawVid.duration_seconds / 60)}m ${Math.round(rawVid.duration_seconds % 60)}s`
    : null;

  const shotDist = rawVid.shot_scale_distribution || {};
  const lightDist = rawVid.lighting_style_distribution || {};

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Camera className="w-5 h-5 text-neural-400" />
          <span>Multimodal Cinematography & Video Analysis</span>
        </h3>
        <span className="text-xs text-neural-400 font-mono flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" />
          <span>Engine: PyTorch ML_VIDEO v{rawVid.engine_version || "1.0"}</span>
        </span>
      </div>

      {/* Multimodal Video Telemetry Strip */}
      <div className="p-5 rounded-2xl bg-cinematic-950/80 border border-white/10 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Duration & Resolution */}
          <div className="p-3.5 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-neural-400" />
              <span>Video Duration</span>
            </span>
            <div className="text-base font-bold text-white font-mono">
              {durationFormatted || "Analyzed"}
            </div>
            {rawVid.resolution && (
              <span className="text-[11px] text-slate-400 font-mono">
                {rawVid.resolution} ({rawVid.aspect_ratio || "16:9"})
              </span>
            )}
          </div>

          {/* Shot Count & Scenes */}
          <div className="p-3.5 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-gold-400" />
              <span>Shots / Scenes</span>
            </span>
            <div className="text-base font-bold text-gold-400 font-mono">
              {rawVid.total_shots ? `${rawVid.total_shots} shots` : "Segmented"}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {rawVid.total_scenes || 1} distinct scene(s)
            </span>
          </div>

          {/* Average Shot Length (ASL) */}
          <div className="p-3.5 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Pacing / ASL</span>
            </span>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {rawVid.average_shot_length_sec ? `${rawVid.average_shot_length_sec.toFixed(2)}s` : "Dynamic"}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {rawVid.cuts_per_minute ? `${rawVid.cuts_per_minute.toFixed(1)} cuts/min` : rawVid.pacing_rhythm || "Paced"}
            </span>
          </div>

          {/* Dominant Framing */}
          <div className="p-3.5 rounded-xl bg-cinematic-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>Dominant Framing</span>
            </span>
            <div className="text-sm font-bold text-indigo-300 truncate">
              {rawVid.predominant_shot_scale || "Balanced Framing"}
            </div>
            <span className="text-[11px] text-slate-400 font-mono truncate block">
              {rawVid.predominant_lighting_style || "Natural Lighting"}
            </span>
          </div>
        </div>

        {/* Visual Distribution Bars: Shot Scale & Lighting Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/5">
          {/* Shot Scale Distribution */}
          <div className="space-y-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-neural-400" />
              <span>Shot Scale Distribution</span>
            </span>
            {Object.keys(shotDist).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(shotDist).map(([scale, data]) => (
                  <div key={scale} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{scale}</span>
                      <span className="text-neural-300">{data.percentage}% ({data.count})</span>
                    </div>
                    <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neural-500 to-indigo-400"
                        style={{ width: `${Math.max(4, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {rawVid.predominant_shot_scale ? `Predominantly ${rawVid.predominant_shot_scale}` : "Uniform visual distribution across sequences."}
              </p>
            )}
          </div>

          {/* Lighting Style Distribution */}
          <div className="space-y-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Lighting & Atmosphere Profile</span>
            </span>
            {Object.keys(lightDist).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(lightDist).map(([style, data]) => (
                  <div key={style} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{style}</span>
                      <span className="text-amber-300">{data.percentage}% ({data.count})</span>
                    </div>
                    <div className="w-full bg-cinematic-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${Math.max(4, data.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {rawVid.predominant_lighting_style ? `Predominantly ${rawVid.predominant_lighting_style}` : "Consistent atmospheric lighting profile."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Narrative Synthesis Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold-400">
            <Film className="w-4 h-4" />
            <span>Visual Grammar & Style</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {cin?.visual_style_overview}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neural-400">
            <Camera className="w-4 h-4" />
            <span>Shot Composition & Framing</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {cin?.shot_composition_assessment}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
            <Sun className="w-4 h-4" />
            <span>Lighting Schemes & Atmosphere</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {cin?.lighting_and_atmosphere}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Activity className="w-4 h-4" />
            <span>Editing Rhythm & Pacing</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {cin?.pacing_and_editing_rhythm}
          </p>
        </div>
      </div>

      {cin?.soundscape_and_speech && (
        <div className="p-4 rounded-xl bg-cinematic-950/70 border border-white/5 flex items-start gap-3">
          <Volume2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 mb-1">
              Acoustic Profile & Speech Dynamics
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {cin.soundscape_and_speech}
            </p>
          </div>
        </div>
      )}

      {/* Key Scene Highlights */}
      {highlights.length > 0 && (
        <div className="pt-2 space-y-3">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Extracted Keyframe Scenes & Critical Beats</span>
          </h4>
          <div className="space-y-2.5">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-cinematic-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-cinematic-800 text-gold-400 font-mono font-semibold">
                    {h.timestamp_range}
                  </span>
                  <span className="font-semibold text-white">{h.shot_type}</span>
                </div>
                <div className="text-slate-300 sm:text-right max-w-md">
                  <span className="text-slate-400">Visual:</span> {h.visual_significance}{" "}
                  <span className="text-slate-400 ml-2">Impact:</span> {h.narrative_impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

