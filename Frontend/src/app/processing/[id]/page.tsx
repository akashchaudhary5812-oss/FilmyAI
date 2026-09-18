"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { ProcessingVisualizer } from "@/components/analysis/ProcessingVisualizer";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";

export default function ProcessingPage() {
  const urlParams = useParams();
  const filmId = (urlParams?.id as string) || "";

  const {
    data: movie,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["movie-processing", filmId],
    queryFn: () => movieApi.getMovieDetails(filmId),
    enabled: Boolean(filmId),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-6">
        <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <ErrorState
          title="Film Ingestion Error"
          message={error instanceof Error ? error.message : "Unable to retrieve uploaded film data."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ProcessingVisualizer movie={movie} />
    </div>
  );
}
