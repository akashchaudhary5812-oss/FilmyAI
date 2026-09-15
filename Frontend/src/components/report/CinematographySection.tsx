import React from "react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Video, Camera, Sun, Activity, Volume2, Film } from "lucide-react";

interface CinematographySectionProps {
  report: FinalFilmIntelligenceReport;
}

export function CinematographySection({ report }: CinematographySectionProps) {
  const cin = report.cinematography_analysis;
  const highlights = report.key_scene_highlights || [];

  return (
    <div className="p-6 rounded-2xl glass-panel space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Camera className="w-5 h-5 text-neural-400" />
          <span>Multimodal Cinematography & Video Analysis</span>
        </h3>
        <span className="text-xs text-neural-400 font-mono">Engine: PyTorch ML_VIDEO</span>
      </div>

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
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
            Extracted Keyframe Scenes & Critical Beats
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
