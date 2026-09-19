"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { FilmGenre } from "@/types/movie";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { ContinueWatchingCarousel } from "@/components/movie/ContinueWatchingCarousel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Clapperboard } from "lucide-react";

export default function MoviesCatalogPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");

  const {
    data: movies = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["all-movies"],
    queryFn: () => movieApi.getAllMovies(),
  });

  const genres = [
    "All",
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
  ];

  const filteredMovies =
    selectedGenre === "All"
      ? movies
      : movies.filter(
          (m) => m.genre.toLowerCase() === selectedGenre.toLowerCase()
        );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-netflix-400">
          <Clapperboard className="w-4 h-4" />
          <span>Production Archives</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
          Film Catalog & Intelligence Library
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse verified studio features, screenplays, and multimodal analysis reports across all genres.
        </p>
      </div>

      {/* Netflix / Prime Video Continue Watching Row */}
      <ContinueWatchingCarousel />

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1">
        {genres.map((g) => {
          const isActive = selectedGenre === g;
          return (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-netflix-500 text-white shadow-md shadow-netflix-500/30"
                  : "bg-cinematic-900 text-slate-300 hover:text-white hover:bg-cinematic-850 border border-cinematic-700"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Movies Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <MovieGrid
          movies={filteredMovies}
          emptyTitle={`No ${selectedGenre} Films Found`}
          emptyDescription={`There are currently no films indexed under '${selectedGenre}'.`}
        />
      )}
    </div>
  );
}
