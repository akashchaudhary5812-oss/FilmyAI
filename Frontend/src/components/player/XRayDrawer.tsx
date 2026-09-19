"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Users,
  Film,
  Building,
  DollarSign,
  Calendar,
  FileText,
  Activity,
  Award,
  ExternalLink,
} from "lucide-react";
import { Movie } from "@/types/movie";
import { Badge } from "../ui/Badge";

interface XRayDrawerProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
}

export function XRayDrawer({ movie, isOpen, onClose, currentTime }: XRayDrawerProps) {
  const [activeTab, setActiveTab] = useState<"cast" | "ai" | "trivia">("ai");

  if (!isOpen) return null;

  // Split cast into array
  const castList = movie.casting
    ? movie.casting.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Principal Cast"];

  const formatTimestamp = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 z-40 w-full max-w-sm sm:max-w-md bg-cinematic-950/95 backdrop-blur-xl border-l border-cinematic-700 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-cinematic-700 flex items-center justify-between bg-cinematic-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-prime-600 to-prime-400 text-white flex items-center justify-center font-black text-xs shadow-md shadow-prime-500/20">
            X
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                X-RAY INSIGHTS
              </h3>
              <Badge variant="prime" className="text-[9px] py-0 px-1.5">
                Prime AI
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Scene Intelligence @ {formatTimestamp(currentTime)}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-cinematic-700 bg-cinematic-900/30 px-3 pt-2 gap-2">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "ai"
              ? "border-prime-400 text-prime-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Scene</span>
        </button>

        <button
          onClick={() => setActiveTab("cast")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "cast"
              ? "border-prime-400 text-prime-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>In Scene ({castList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("trivia")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === "trivia"
              ? "border-prime-400 text-prime-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Trivia & Film</span>
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {activeTab === "ai" && (
          <div className="space-y-4">
            {/* Multimodal Tone Card */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Realtime Scene Rhythm
                </span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
                  92% Engagement
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Visual framing emphasizes high dynamic contrast and cinematic lighting calibrated for {movie.genre} immersion.
              </p>
            </div>

            {/* Neural Insights Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-cinematic-900 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Genre Signature</span>
                <p className="text-xs font-bold text-netflix-400">{movie.genre}</p>
              </div>
              <div className="p-3 rounded-xl bg-cinematic-900 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Pacing Curve</span>
                <p className="text-xs font-bold text-emerald-400">Dynamic 8.9 / 10</p>
              </div>
            </div>

            {/* Synopsis overview */}
            <div className="p-3.5 rounded-xl bg-cinematic-900 border border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-netflix-400" />
                Script Context
              </span>
              <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed">
                {movie.summary || "This film was indexed through the FilmyAI studio pipeline with multimodal audio-visual and script evaluation."}
              </p>
            </div>

            {/* CTA to Full Report */}
            <Link
              href={`/film-report/${movie.id}`}
              target="_blank"
              className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-netflix-600/20 to-netflix-500/10 border border-netflix-500/30 hover:border-netflix-500/60 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-netflix-400 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-bold text-white">Full Intelligence Dossier</h4>
                  <p className="text-[10px] text-netflix-400/80">View complete commercial forecast &amp; RAG</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-netflix-400" />
            </Link>
          </div>
        )}

        {activeTab === "cast" && (
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Starring In This Production
            </h4>
            <div className="space-y-2">
              {castList.map((actor, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cinematic-900 border border-white/5 hover:border-cyan-500/30 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-700 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-inner">
                    {actor.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">{actor}</h5>
                    <p className="text-[10px] text-slate-400 truncate">Featured Ensemble</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "trivia" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-cinematic-900 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Building className="w-3.5 h-3.5 text-netflix-400" />
                <span>Production & Studio House</span>
              </div>
              <p className="text-xs text-slate-300">
                {movie.productionHouses.length ? movie.productionHouses.join(", ") : "Independent Studio Production"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cinematic-900 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Declared Budget</span>
              </div>
              <p className="text-xs text-slate-300 font-mono">{movie.budget}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-cinematic-900 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Director & Era</span>
              </div>
              <p className="text-xs text-slate-300">
                Directed by <span className="text-white font-semibold">{movie.director}</span> ({movie.year || 2025})
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
