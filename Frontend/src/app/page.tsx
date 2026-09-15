"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { filterMoviesByGenre } from "@/lib/adapters/movieAdapter";
import { MovieHero } from "@/components/movie/MovieHero";
import { MovieCarousel } from "@/components/movie/MovieCarousel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Sparkles, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const {
    data: movies = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["all-movies"],
    queryFn: () => movieApi.getAllMovies(),
  });

  const heroMovie = movies.length > 0 ? movies[0] : undefined;
  const trendingMovies = movies.slice(0, 10);
  const actionMovies = filterMoviesByGenre(movies, "Action");
  const comedyMovies = filterMoviesByGenre(movies, "Comedy");
  const sciFiMovies = filterMoviesByGenre(movies, "Sci-Fi");
  const dramaMovies = filterMoviesByGenre(movies, "Drama");

  // Filter for authenticated user's uploaded films (or all films if demo)
  const userMovies = movies.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-10 pb-16">
        <Skeleton className="w-full h-[65vh] min-h-[480px]" />
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <Skeleton className="h-8 w-60" />
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="w-56 h-80 rounded-xl flex-shrink-0" />
            <Skeleton className="w-56 h-80 rounded-xl flex-shrink-0" />
            <Skeleton className="w-56 h-80 rounded-xl flex-shrink-0" />
            <Skeleton className="w-56 h-80 rounded-xl flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <MovieHero movie={heroMovie} />

      {/* Main Content Area */}
      {movies.length === 0 ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="p-8 rounded-3xl glass-panel text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 text-gold-400 mx-auto flex items-center justify-center border border-gold-500/20">
              <Clapperboard className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white font-display">
              Studio Catalog Awaiting First Ingestion
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              No films have been uploaded to the backend database yet. Be the first to upload a film and generate an AI intelligence report.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/analyze")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upload & Analyze Film Now
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 10 Trending Movies */}
          <MovieCarousel
            title="Top Trending Movies"
            subtitle="Most viewed and analyzed studio productions"
            movies={trendingMovies}
          />

          {/* Authenticated User's Films */}
          {isAuthenticated && (
            <div className="bg-cinematic-900/40 py-2 border-y border-white/5">
              <MovieCarousel
                title="Your Studio Productions"
                subtitle={`Films and dossiers in ${user?.username}'s workspace`}
                movies={userMovies}
              />
            </div>
          )}

          {/* Genre: Action Films */}
          {actionMovies.length > 0 && (
            <MovieCarousel
              title="Action & Thrillers"
              subtitle="High pacing, kinetic cinematography, and explosive set pieces"
              movies={actionMovies}
            />
          )}

          {/* Genre: Sci-Fi Films */}
          {sciFiMovies.length > 0 && (
            <MovieCarousel
              title="Sci-Fi & Speculative"
              subtitle="Worldbuilding, conceptual hooks, and visual innovation"
              movies={sciFiMovies}
            />
          )}

          {/* Genre: Drama & Romance */}
          {(dramaMovies.length > 0 || comedyMovies.length > 0) && (
            <MovieCarousel
              title="Drama & Character Studies"
              subtitle="Nuanced character arcs, dialogue rhythm, and emotional depth"
              movies={[...dramaMovies, ...comedyMovies]}
            />
          )}
        </div>
      )}
    </div>
  );
}
