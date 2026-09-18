"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { CinemaPlayer } from "@/components/player/CinemaPlayer";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { ArrowLeft, Clapperboard } from "lucide-react";
import Link from "next/link";

export default function WatchMoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = (params?.id as string) || "";

  // Fetch current movie
  const {
    data: movie,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movie-details", movieId],
    queryFn: () => movieApi.getMovieDetails(movieId),
    enabled: Boolean(movieId),
  });

  // Fetch all movies for Up Next recommendations
  const { data: allMovies = [] } = useQuery({
    queryKey: ["all-movies"],
    queryFn: () => movieApi.getAllMovies(),
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-cinematic-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-400 rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white font-display tracking-wide">
            Loading Cinema Theater...
          </p>
          <p className="text-xs text-slate-500 font-mono">Calibrating Stream & X-Ray Telemetry</p>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-cinematic-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl glass-panel text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
            <Clapperboard className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Film Not Found</h2>
          <p className="text-xs text-slate-400">
            {error instanceof Error ? error.message : "The requested movie could not be located in the catalog."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/movies"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Catalog</span>
            </Link>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-cinematic-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CinemaPlayer movie={movie} allMovies={allMovies} />;
}
