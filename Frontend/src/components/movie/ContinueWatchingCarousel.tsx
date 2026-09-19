"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, X, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import { useWatchProgress } from "@/hooks/useWatchProgress";

export function ContinueWatchingCarousel() {
  const { watchHistory, removeProgress } = useWatchProgress();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!watchHistory || watchHistory.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const formatRemaining = (duration: number, progress: number) => {
    const leftSecs = Math.max(0, duration - progress);
    const mins = Math.ceil(leftSecs / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m left`;
    }
    return `${mins}m left`;
  };

  return (
    <div className="relative group/carousel py-4 space-y-3">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-netflix-500/15 text-netflix-400 border border-netflix-500/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
              <span>Continue Watching</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-netflix-500/20 text-netflix-400 border border-netflix-500/30">
                {watchHistory.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Pick up right where you paused</p>
          </div>
        </div>

        {/* Carousel controls */}
        {watchHistory.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-cinematic-900/80 text-slate-300 hover:text-white hover:bg-cinematic-800 border border-cinematic-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-cinematic-900/80 text-slate-300 hover:text-white hover:bg-cinematic-800 border border-cinematic-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cards Slider */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pb-4 pt-1"
      >
        {watchHistory.map((item) => {
          const isVideo =
            typeof item.posterUrl === "string" &&
            /\.(mp4|webm|mov|mkv)$/i.test(item.posterUrl.split("?")[0]);

          return (
            <div
              key={item.movieId}
              className="group relative flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-cinematic-900 border border-cinematic-700 hover:border-cinematic-600 hover:shadow-2xl hover:shadow-black/75 transition-all duration-300 select-none"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-cinematic-950">
                {item.posterUrl && !isVideo ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-90 contrast-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cinematic-900 via-cinematic-850 to-cinematic-950 flex items-center justify-center p-4">
                    <span className="text-xs font-bold text-slate-300 text-center line-clamp-2">
                      {item.title}
                    </span>
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-cinematic-950 via-cinematic-950/40 to-transparent" />

                {/* Center Play Button on Hover */}
                <Link
                  href={`/watch/${item.movieId}`}
                  className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]"
                >
                  <div className="w-12 h-12 rounded-full bg-netflix-500 text-white flex items-center justify-center shadow-xl shadow-netflix-500/35 transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </Link>

                {/* Remove from Continue Watching Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeProgress(item.movieId);
                  }}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/70 hover:bg-black text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Remove from Continue Watching"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Remaining Time Pill */}
                <div className="absolute bottom-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-slate-200 border border-cinematic-700 backdrop-blur-sm">
                    {formatRemaining(item.durationSeconds, item.progressSeconds)}
                  </span>
                </div>
              </div>

              {/* Red Signature Progress Bar (Netflix style) */}
              <div className="w-full h-1.5 bg-cinematic-800 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-700 via-netflix-500 to-netflix-400 shadow-sm"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>

              {/* Card Meta Footer */}
              <div className="p-3 flex items-center justify-between bg-cinematic-900/90">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.genre} • {item.director}
                  </p>
                </div>

                <Link
                  href={`/watch/${item.movieId}`}
                  className="p-1.5 rounded-lg bg-cinematic-800 hover:bg-netflix-500 border border-cinematic-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                  title="Resume"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
