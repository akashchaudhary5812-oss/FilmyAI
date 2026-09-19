"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Sparkles, Film, ArrowRight, Play } from "lucide-react";
import { Movie } from "@/types/movie";
import { Badge } from "../ui/Badge";
import { useWatchProgress } from "@/hooks/useWatchProgress";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const { currentProgress } = useWatchProgress(movie.id);

  // Fallback poster background with nice film typography if image is missing or broken
  const fallbackBg =
    "linear-gradient(135deg, #131722 0%, #1c2236 50%, #0d0f17 100%)";

  const isVideo =
    typeof movie.posterUrl === "string" &&
    (/\.(mp4|webm|mov|mkv|avi)$/i.test(movie.posterUrl.split("?")[0]) ||
      movie.posterUrl.includes("/uploads/videos/"));

  return (
    <div className="group relative flex-shrink-0 w-44 sm:w-56 md:w-64 rounded-xl overflow-hidden bg-cinematic-900 border border-cinematic-700 transition-all duration-300 hover:scale-[1.03] hover:border-cinematic-600 hover:shadow-2xl hover:shadow-black/75 select-none">
      {/* Aspect ratio container (2:3 poster format) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinematic-950">
        {movie.posterUrl && !isVideo && !imageError ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 176px, (max-width: 768px) 224px, 256px"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
            style={{ background: fallbackBg }}
          >
            <Film className="w-12 h-12 text-slate-500 mb-2" />
            <span className="text-xs font-semibold text-slate-300 font-display line-clamp-2">
              {movie.title}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
              {movie.genre}
            </span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <Badge variant="prime" className="text-[10px] px-2 py-0.5 backdrop-blur-md">
            {movie.genre}
          </Badge>

          {movie.rating && (
            <div className="flex items-center gap-1 bg-cinematic-950/85 backdrop-blur-md px-2 py-0.5 rounded-full border border-cinematic-700 text-amber-400 text-xs font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{movie.rating}</span>
            </div>
          )}
        </div>

        {/* Cinematic Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinematic-950 via-cinematic-950/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20">
          {/* Quick Play Circle Icon in Top Center on Hover */}
          <div className="flex justify-center pt-8">
            <Link
              href={`/watch/${movie.id}`}
              className="w-12 h-12 rounded-full bg-netflix-500 hover:bg-netflix-400 text-white flex items-center justify-center shadow-xl shadow-netflix-500/35 transform hover:scale-110 transition-transform cursor-pointer"
              title="Watch Movie"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </Link>
          </div>

          <div>
            <h4 className="text-base font-bold text-white font-display line-clamp-1 mb-1">
              {movie.title}
            </h4>

            <div className="text-xs text-slate-400 mb-2">
              <span>Dir: {movie.director}</span>
              {movie.year && <span> • {movie.year}</span>}
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
              {movie.summary || `Starring ${movie.casting}. Produced by ${movie.productionHouses.join(", ") || "Independent"}.`}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cinematic-700">
              <Link
                href={`/watch/${movie.id}`}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-netflix-500 hover:bg-netflix-400 text-white text-xs font-bold transition-colors shadow-sm shadow-netflix-500/20"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>
                  {currentProgress && currentProgress.progressPercent > 5 ? "Resume" : "Watch"}
                </span>
              </Link>

              <Link
                href={`/movies/${movie.id}`}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-cinematic-850 hover:bg-cinematic-800 border border-cinematic-700 text-slate-100 text-xs font-medium transition-colors"
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* In-Progress Watched Progress Bar Indicator (Netflix signature red) */}
        {currentProgress && currentProgress.progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-20">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-netflix-500 to-netflix-400"
              style={{ width: `${currentProgress.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Footer for quick scanning on mobile/desktop without hover */}
      <div className="p-3 bg-cinematic-900 border-t border-cinematic-700/60">
        <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
          <span className="truncate max-w-[120px]">{movie.director}</span>
          <span>{movie.year || 2025}</span>
        </div>
      </div>
    </div>
  );
}
