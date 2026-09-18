"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { MovieDetailsView } from "@/components/movie/MovieDetailsView";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";

export default function MovieDetailsPage() {
  const urlParams = useParams();
  const filmId = (urlParams?.id as string) || "";
  const router = useRouter();

  const {
    data: movie,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movie-details", filmId],
    queryFn: () => movieApi.getMovieDetails(filmId),
    enabled: Boolean(filmId),
  });

  if (isLoading) {
    return (
      <div className="space-y-8 pb-20">
        <Skeleton className="w-full h-[55vh]" />
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <ErrorState
          title="Movie Not Found"
          message={error instanceof Error ? error.message : "Unable to locate this film in the database."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return <MovieDetailsView movie={movie} />;
}
