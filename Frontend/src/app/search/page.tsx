"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, Clapperboard } from "lucide-react";
import { movieApi } from "@/lib/api/movies";
import { searchMoviesCatalog } from "@/lib/adapters/movieAdapter";
import { useDebounce } from "@/hooks/useDebounce";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data: allMovies = [],
    isLoading,
  } = useQuery({
    queryKey: ["all-movies"],
    queryFn: () => movieApi.getAllMovies(),
  });

  const searchResults = searchMoviesCatalog(allMovies, debouncedSearch);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-prime-400">
          <Clapperboard className="w-4 h-4" />
          <span>Multi-Parametric Cinema Search</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
          Search Film Archives
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Query by film title, director, cast ensemble, genre, or narrative synopsis.
        </p>

        {/* Search Input Box */}
        <div className="relative mt-6">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, director, actor, or genre..."
            autoFocus
            className="w-full bg-cinematic-900/90 border border-cinematic-700 rounded-2xl py-3.5 pl-12 pr-10 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 focus:ring-2 focus:ring-prime-500/20 shadow-xl transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-slate-400 font-mono">
        <span>
          {debouncedSearch
            ? `Search results for "${debouncedSearch}"`
            : "Complete Indexed Catalog"}
        </span>
        <span>{searchResults.length} films matching</span>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <MovieGrid
          movies={searchResults}
          emptyTitle="No Matching Films Found"
          emptyDescription={`We couldn't find any films matching "${debouncedSearch}". Try searching for a director name or genre.`}
        />
      )}
    </div>
  );
}
