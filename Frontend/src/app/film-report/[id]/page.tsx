"use client";

import React, { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { reportApi } from "@/lib/api/reports";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ExecutiveSummaryView } from "@/components/report/ExecutiveSummaryView";
import { CinematographySection } from "@/components/report/CinematographySection";
import { CommercialMetrics } from "@/components/report/CommercialMetrics";
import { CreativeAssessment } from "@/components/report/CreativeAssessment";
import { StrategicRoadmap } from "@/components/report/StrategicRoadmap";
import { RagChatbot } from "@/components/chatbot/RagChatbot";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { normalizeReport } from "@/lib/adapters/reportAdapter";

export default function FilmReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const filmId = resolvedParams.id;

  const [report, setReport] = useState<FinalFilmIntelligenceReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch movie details from backend
  const {
    data: movie,
    isLoading: isMovieLoading,
    isError: isMovieError,
    error: movieError,
    refetch: refetchMovie,
  } = useQuery({
    queryKey: ["movie-details", filmId],
    queryFn: () => movieApi.getMovieDetails(filmId),
  });

  useEffect(() => {
    // Check if session storage already holds this report
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`filmy_report_${filmId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setReport(normalizeReport(parsed));
          return;
        } catch {
          // If parse fails, regenerate
        }
      }
    }

    // If movie is loaded and report not in session, generate from report API
    if (movie) {
      let isMounted = true;
      setIsGenerating(true);

      reportApi
        .generateReport({
          FilmName: movie.title,
          uploadFilm: movie.posterUrl,
          DirectorName: movie.director,
          Casting: movie.casting,
          ProductionHouses: movie.productionHouses.join(", "),
          Budget: movie.budget,
          Genre: movie.genre,
          Script: movie.script,
          Summary: movie.summary,
          generate_pdf: true,
        })
        .then((generated) => {
          if (isMounted) {
            setReport(generated);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`filmy_report_${filmId}`, JSON.stringify(generated));
            }
          }
        })
        .catch((err) => {
          console.warn("Report generation error:", err);
          if (isMounted) {
            setReport(
              normalizeReport({
                film_title: movie.title,
                metadata_summary: {
                  director: movie.director,
                  casting: movie.casting,
                  genre: movie.genre,
                },
              })
            );
          }
        })
        .finally(() => {
          if (isMounted) setIsGenerating(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [movie, filmId]);

  if (isMovieLoading || (isGenerating && !report)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton className="w-full h-48 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[650px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isMovieError || !movie) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <ErrorState
          title="Film Report Unavailable"
          message={movieError instanceof Error ? movieError.message : "Unable to retrieve film metadata."}
          onRetry={() => refetchMovie()}
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <ErrorState
          title="Intelligence Generation Failed"
          message="Could not generate the film intelligence report."
          onRetry={() => refetchMovie()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header Banner */}
      <ReportHeader report={report} />

      {/* Main Grid: Report Sections (2/3) + Chatbot (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Structured Intelligence Dossier */}
        <div className="lg:col-span-2 space-y-8">
          <ExecutiveSummaryView report={report} />
          <CinematographySection report={report} />
          <CommercialMetrics report={report} />
          <CreativeAssessment report={report} />
          <StrategicRoadmap report={report} />
        </div>

        {/* Right 1 Column: Grounded RAG Chatbot Assistant */}
        <div className="lg:col-span-1">
          <RagChatbot report={report} />
        </div>
      </div>
    </div>
  );
}
