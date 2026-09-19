import React from "react";
import {
  FinalFilmIntelligenceReport,
  CharacterJourneyItem,
  PacingSegment,
  TechnicalCreativePeak,
} from "@/types/report";
import { Heart, Compass, Flame, Award, Clock, ArrowRight, Sparkles, Activity, AlertCircle } from "lucide-react";
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
        return "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
      case "SLOW":
      case "DRAG":
        return "bg-amber-950/80 text-amber-400 border-amber-500/30";
      case "RUSHED":
        return "bg-crimson-950/80 text-crimson-400 border-crimson-500/30";
      default:
        return "bg-neural-950/80 text-neural-400 border-neural-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Character Emotional Journey */}
      {hasJourney && (
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Heart className="w-5 h-5 text-crimson-400" />
                <span>Character & Emotional Journey</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Narrative arcs, psychological inflection points, and character evolution
              </p>
            </div>
            {journey.climax_timestamp && (
              <span className="text-xs font-mono text-gold-400 bg-gold-950/60 px-2.5 py-1 rounded-full border border-gold-500/30">
                Climax: {journey.climax_timestamp}
              </span>
            )}
          </div>

          {journey.film_emotional_progression && (
            <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/10 text-xs text-slate-300 leading-relaxed">
              <span className="font-mono text-[10px] uppercase text-crimson-400 tracking-wider font-bold block mb-1">
                Progression Overview
              </span>
              {journey.film_emotional_progression}
            </div>
          )}

          {/* Character Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char, cIdx) => (
              <div
                key={`char-${cIdx}`}
                className="p-4 rounded-xl bg-cinematic-950/60 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{char.character_name}</h4>
                    {char.actor_name && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Portrayed by {char.actor_name}
                      </span>
                    )}
                  </div>
                  {char.arc_coherence != null && (
                    <span className="font-mono text-xs font-bold text-gold-400 bg-gold-950/60 px-2 py-0.5 rounded border border-gold-500/30">
                      Arc: {char.arc_coherence.toFixed(1)}/10
                    </span>
                  )}
                </div>

                {/* State Transition (Starting -> Ending) */}
                {(char.starting_state || char.ending_state) && (
                  <div className="flex items-center gap-2 text-xs p-2 rounded bg-cinematic-900/80 border border-white/5">
                    <span className="text-slate-400 text-[11px] truncate flex-1">
                      {char.starting_state || "Initial state"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    <span className="text-emerald-300 text-[11px] font-semibold truncate flex-1 text-right">
                      {char.ending_state || "Resolved state"}
                    </span>
                  </div>
                )}

                {/* Emotional Transitions */}
                {char.emotional_transitions && char.emotional_transitions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Emotional Key Transitions
                    </span>
                    {char.emotional_transitions.map((tr, tIdx) => (
                      <div
                        key={tIdx}
                        className="text-[11px] p-2 rounded bg-cinematic-900/50 border border-white/5 text-slate-300 flex items-start gap-1.5"
                      >
                        {tr.timestamp && (
                          <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                            {tr.timestamp}
                          </span>
                        )}
                        <span>
                          <strong className="text-slate-200">{tr.from_state}</strong> →{" "}
                          <strong className="text-gold-300">{tr.to_state}</strong>
                          {tr.trigger && <span className="text-slate-400"> ({tr.trigger})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pacing & Rhythm Map */}
      {hasPacing && (
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Compass className="w-5 h-5 text-gold-400" />
                <span>Pacing & Narrative Rhythm Dynamics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Shot cadence, structural tension peaks, and audience retention modeling
              </p>
            </div>
            {pacing.pacing_consistency && (
              <Badge variant="neural" className="text-[10px] uppercase font-mono">
                {pacing.pacing_consistency} Consistency
              </Badge>
            )}
          </div>

          {pacing.overall_rhythm && (
            <div className="p-4 rounded-xl bg-cinematic-950/80 border border-white/10 text-xs text-slate-300 leading-relaxed">
              <span className="font-mono text-[10px] uppercase text-gold-400 tracking-wider font-bold block mb-1">
                Rhythm Diagnostics
              </span>
              {pacing.overall_rhythm}
            </div>
          )}

          {/* Segments Strip */}
          {segments.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Pacing Progression Segments
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {segments.map((seg, sIdx) => (
                  <div
                    key={`seg-${sIdx}`}
                    className="p-3 rounded-lg bg-cinematic-950/60 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neural-400" />
                        {seg.timestamp_start} - {seg.timestamp_end}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getPacingBadgeColor(
                          seg.pacing_label
                        )}`}
                      >
                        {seg.pacing_label}
                      </span>
                    </div>
                    {seg.avg_shot_length_sec != null && (
                      <div className="text-[10px] font-mono text-slate-400">
                        Avg Shot: {seg.avg_shot_length_sec.toFixed(1)}s
                      </div>
                    )}
                    {seg.notes && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">{seg.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retention & Pacing Flags */}
          {(pacing.drag_points?.length || pacing.rushed_sections?.length || pacing.peak_intensity_moments?.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              {pacing.peak_intensity_moments && pacing.peak_intensity_moments.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Peak Intensity</span>
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {pacing.peak_intensity_moments.join(", ")}
                  </p>
                </div>
              )}
              {pacing.drag_points && pacing.drag_points.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Potential Drag</span>
                  </span>
                  <p className="text-slate-300 text-[11px]">{pacing.drag_points.join(", ")}</p>
                </div>
              )}
              {pacing.rushed_sections && pacing.rushed_sections.length > 0 && (
                <div className="p-3 rounded-lg bg-crimson-950/20 border border-crimson-500/20 space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-crimson-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>Rushed Beats</span>
                  </span>
                  <p className="text-slate-300 text-[11px]">{pacing.rushed_sections.join(", ")}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Technical & Creative Peaks */}
      {hasPeaks && (
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-400" />
                <span>Multimodal Cinematic Peaks</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Key master sequences where visual composition, sound, acting, and writing achieve maximum synergy
              </p>
            </div>
            <span className="text-xs font-mono text-gold-400 bg-gold-950/60 px-2.5 py-1 rounded-full border border-gold-500/30">
              {peaks.length} Peak Moment{peaks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {peaks.map((peak, pIdx) => (
              <div
                key={`peak-${pIdx}`}
                className="p-4 rounded-xl bg-gradient-to-r from-cinematic-950/90 via-gold-950/10 to-cinematic-950/90 border border-gold-500/30 hover:border-gold-500/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-400 bg-gold-950/80 px-2.5 py-1 rounded-md border border-gold-500/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {peak.timestamp_range || `${peak.timestamp_start} - ${peak.timestamp_end}`}
                    </span>
                    <span className="font-bold text-white text-sm">
                      Master Sequence {pIdx + 1}
                    </span>
                  </div>
                  {peak.overall_peak_score != null && (
                    <span className="font-mono text-xs font-bold text-gold-400 bg-gold-950/80 px-2.5 py-1 rounded-full border border-gold-500/40 w-fit">
                      Peak Score: {peak.overall_peak_score.toFixed(1)}/10
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{peak.reason}</p>

                {/* Score Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                  {peak.cinematography_score != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Visual</span>
                      <span className="font-bold text-slate-200">{peak.cinematography_score.toFixed(1)}</span>
                    </div>
                  )}
                  {peak.acting_score != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Acting</span>
                      <span className="font-bold text-slate-200">{peak.acting_score.toFixed(1)}</span>
                    </div>
                  )}
                  {peak.audio_score != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Sound</span>
                      <span className="font-bold text-slate-200">{peak.audio_score.toFixed(1)}</span>
                    </div>
                  )}
                  {peak.emotion_score != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Emotion</span>
                      <span className="font-bold text-slate-200">{peak.emotion_score.toFixed(1)}</span>
                    </div>
                  )}
                  {peak.story_score != null && (
                    <div className="p-1.5 rounded bg-cinematic-900/80 border border-white/5 text-center">
                      <span className="text-[10px] text-slate-400 block">Story</span>
                      <span className="font-bold text-slate-200">{peak.story_score.toFixed(1)}</span>
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
