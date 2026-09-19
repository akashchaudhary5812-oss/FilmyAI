"use client";

import React from "react";
import {
  FinalFilmIntelligenceReport,
  CharacterJourneyItem,
  PacingSegment,
  TechnicalCreativePeak,
} from "@/types/report";
import {
  Heart,
  Compass,
  Flame,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  Activity,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface PacingAndJourneyProps {
  report: FinalFilmIntelligenceReport;
}

export function PacingAndJourneySection({ report }: PacingAndJourneyProps) {
  const journey = report.character_emotional_journey;
  const pacing = report.pacing_rhythm_map;
  const peaks = report.technical_creative_peaks || [];

  const characters: CharacterJourneyItem[] = journey?.characters || [];
  const segments: PacingSegment[] = pacing?.pacing_segments || [];

  const hasJourney = !!journey && characters.length > 0;
  const hasPacing = !!pacing && (!!pacing.overall_rhythm || segments.length > 0);
  const hasPeaks = peaks.length > 0;

  if (!hasJourney && !hasPacing && !hasPeaks) {
    return null;
  }

  const getPacingBadgeColor = (label: string) => {
    switch (label) {
      case "PEAK":
      case "ACCELERATED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      case "SLOW":
      case "DRAG":
        return "bg-amber-950/80 text-amber-300 border-amber-500/40";
      case "RUSHED":
        return "bg-rose-950/80 text-rose-300 border-rose-500/40";
      default:
        return "bg-prime-950/80 text-prime-300 border-prime-500/40";
    }
  };

  return (
    <div id="section-pacing" className="space-y-6 scroll-mt-24">
      {/* 1. Character Emotional Journey */}
      {hasJourney && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                  Character & Emotional Journey
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Narrative Arcs, Psychological Inflection Points & Dramatic Catharsis
                </p>
              </div>
            </div>

            {journey.climax_timestamp && (
              <span className="text-xs font-mono text-gold-300 bg-gold-950/60 px-3 py-1.5 rounded-full border border-gold-500/40 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-gold-400" />
                <span>Climax: {journey.climax_timestamp}</span>
              </span>
            )}
          </div>

          {journey.film_emotional_progression && (
            <div className="p-5 rounded-2xl bg-cinematic-900/90 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans shadow-inner">
              <span className="font-mono text-[10px] uppercase text-rose-400 tracking-wider font-bold block mb-1">
                Progression Synthesis
              </span>
              {journey.film_emotional_progression}
            </div>
          )}

          {/* Character Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char, cIdx) => (
              <div
                key={`char-${cIdx}`}
                className="p-5 rounded-2xl bg-cinematic-900/80 border border-white/10 space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg font-sans">
                      {char.character_name}
                    </h4>
                    {char.actor_name && (
                      <span className="text-xs text-slate-400 font-mono">
                        Portrayed by {char.actor_name}
                      </span>
                    )}
                  </div>
                  {char.arc_coherence != null && (
                    <span className="font-mono text-xs font-bold text-gold-300 bg-gold-950/60 px-2.5 py-1 rounded-full border border-gold-500/40">
                      Arc: {char.arc_coherence.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                {/* State Transition (Starting -> Ending) */}
                {(char.starting_state || char.ending_state) && (
                  <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-cinematic-950/90 border border-white/5">
                    <span className="text-slate-300 text-xs truncate flex-1 font-medium">
                      {char.starting_state || "Initial state"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gold-400 shrink-0" />
                    <span className="text-emerald-300 text-xs font-bold truncate flex-1 text-right">
                      {char.ending_state || "Resolved state"}
                    </span>
                  </div>
                )}

                {/* Emotional Transitions */}
                {char.emotional_transitions && char.emotional_transitions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      Emotional Turning Points
                    </span>
                    <div className="space-y-1">
                      {char.emotional_transitions.map((tr, tIdx) => (
                        <div
                          key={tIdx}
                          className="text-xs p-2.5 rounded-xl bg-cinematic-950/60 border border-white/5 text-slate-300 flex items-start gap-2"
                        >
                          {tr.timestamp && (
                            <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded shrink-0">
                              {tr.timestamp}
                            </span>
                          )}
                          <span className="text-xs leading-relaxed">
                            <strong className="text-slate-200">{tr.from_state}</strong> →{" "}
                            <strong className="text-gold-300">{tr.to_state}</strong>
                            {tr.trigger && (
                              <span className="text-slate-400"> ({tr.trigger})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pacing & Rhythm Map */}
      {hasPacing && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-md">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                  Pacing & Narrative Rhythm Dynamics
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Shot Cadence, Structural Tension Peaks & Audience Retention Modeling
                </p>
              </div>
            </div>

            {pacing.pacing_consistency && (
              <Badge variant="neural" className="text-xs uppercase font-mono">
                {pacing.pacing_consistency} Consistency
              </Badge>
            )}
          </div>

          {pacing.overall_rhythm && (
            <div className="p-5 rounded-2xl bg-cinematic-900/90 border border-white/10 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans shadow-inner">
              <span className="font-mono text-[10px] uppercase text-gold-400 tracking-wider font-bold block mb-1">
                Rhythm Diagnostic Evaluation
              </span>
              {pacing.overall_rhythm}
            </div>
          )}

          {/* Segments Strip */}
          {segments.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Pacing Progression Segments
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {segments.map((seg, sIdx) => (
                  <div
                    key={`seg-${sIdx}`}
                    className="p-4 rounded-xl bg-cinematic-900/70 border border-white/10 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-300 flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-prime-400" />
                        {seg.timestamp_start} – {seg.timestamp_end}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getPacingBadgeColor(
                          seg.pacing_label
                        )}`}
                      >
                        {seg.pacing_label}
                      </span>
                    </div>

                    {seg.avg_shot_length_sec != null && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Avg Shot:{" "}
                        <strong className="text-white">
                          {seg.avg_shot_length_sec.toFixed(1)}s
                        </strong>
                      </div>
                    )}

                    {seg.notes && (
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {seg.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retention & Pacing Flags */}
          {(pacing.drag_points?.length ||
            pacing.rushed_sections?.length ||
            pacing.peak_intensity_moments?.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
              {pacing.peak_intensity_moments && pacing.peak_intensity_moments.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1 shadow-sm">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Peak Intensity</span>
                  </span>
                  <p className="text-slate-200 text-xs">
                    {pacing.peak_intensity_moments.join(", ")}
                  </p>
                </div>
              )}
              {pacing.drag_points && pacing.drag_points.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 shadow-sm">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Potential Drag</span>
                  </span>
                  <p className="text-slate-200 text-xs">{pacing.drag_points.join(", ")}</p>
                </div>
              )}
              {pacing.rushed_sections && pacing.rushed_sections.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1 shadow-sm">
                  <span className="font-mono text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Rushed Beats</span>
                  </span>
                  <p className="text-slate-200 text-xs">{pacing.rushed_sections.join(", ")}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Technical & Creative Peaks */}
      {hasPeaks && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6 relative overflow-hidden border border-white/10 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-md">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                  Multimodal Cinematic Peaks
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Master Sequences where Visuals, Sound, Acting & Writing Achieve Maximum Synergy
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-gold-300 bg-gold-950/60 px-3 py-1.5 rounded-full border border-gold-500/40">
              {peaks.length} Master Sequence{peaks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-4">
            {peaks.map((peak, pIdx) => (
              <div
                key={`peak-${pIdx}`}
                className="p-5 rounded-2xl bg-gradient-to-r from-cinematic-900/90 via-gold-950/20 to-cinematic-900/90 border border-gold-500/30 hover:border-gold-500/50 transition-all space-y-3.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-gold-300 bg-gold-950/80 px-3 py-1 rounded-lg border border-gold-500/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {peak.timestamp_range ||
                        `${peak.timestamp_start} – ${peak.timestamp_end}`}
                    </span>
                    <span className="font-bold text-white text-base font-sans">
                      Master Sequence {pIdx + 1}
                    </span>
                  </div>

                  {peak.overall_peak_score != null && (
                    <span className="font-mono text-xs font-bold text-gold-300 bg-gold-950/80 px-3 py-1 rounded-full border border-gold-500/40 w-fit">
                      Peak Score: {peak.overall_peak_score.toFixed(1)} / 10
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {peak.reason}
                </p>

                {/* Score Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  {peak.cinematography_score != null && (
                    <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Visual</span>
                      <span className="font-bold text-slate-100">
                        {peak.cinematography_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {peak.acting_score != null && (
                    <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Acting</span>
                      <span className="font-bold text-slate-100">
                        {peak.acting_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {peak.audio_score != null && (
                    <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Sound</span>
                      <span className="font-bold text-slate-100">{peak.audio_score.toFixed(1)}</span>
                    </div>
                  )}
                  {peak.emotion_score != null && (
                    <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Emotion</span>
                      <span className="font-bold text-slate-100">
                        {peak.emotion_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {peak.story_score != null && (
                    <div className="p-2 rounded-xl bg-cinematic-950/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block uppercase">Story</span>
                      <span className="font-bold text-slate-100">{peak.story_score.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
