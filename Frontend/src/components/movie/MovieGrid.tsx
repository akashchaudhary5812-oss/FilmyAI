"use client";

import React from "react";
import { Movie } from "@/types/movie";
import { MovieCard } from "./MovieCard";
import { EmptyState } from "../ui/EmptyState";

interface MovieGridProps {
  movies: Movie[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function MovieGrid({
  movies,
  emptyTitle = "No Films Available",
  emptyDescription = "There are no movies found in this section.",
}: MovieGridProps) {
  if (!movies || movies.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {movies.map((movie) => (
        <div key={movie.id} className="flex justify-center">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  );
}
