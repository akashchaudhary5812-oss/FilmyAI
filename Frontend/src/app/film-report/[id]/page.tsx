"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { movieApi } from "@/lib/api/movies";
import { reportApi } from "@/lib/api/reports";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ExecutiveSummaryView } from "@/components/report/ExecutiveSummaryView";
import { CinematographySection } from "@/components/report/CinematographySection";
import { ScenePointsSection } from "@/components/report/ScenePointsSection";
import { SceneTimelineSection } from "@/components/report/SceneTimelineSection";
import { CastPerformanceSection } from "@/components/report/CastPerformanceSection";
import { PacingAndJourneySection } from "@/components/report/PacingAndJourneySection";
import { CommercialMetrics } from "@/components/report/CommercialMetrics";
import { CreativeAssessment } from "@/components/report/CreativeAssessment";
import { StrategicRoadmap } from "@/components/report/StrategicRoadmap";
import { RagChatbot } from "@/components/chatbot/RagChatbot";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { normalizeReport } from "@/lib/adapters/reportAdapter";

export default function FilmReportPage() {
  const urlParams = useParams();
  const filmId = (urlParams?.id as string) || "";

  const [report, setReport] = useState<FinalFilmIntelligenceReport | null>(null);
  const [isFetchingReport, setIsFetchingReport] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

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
    let isMounted = true;

    async function loadReport() {
      setIsFetchingReport(true);
      setReportError(null);

      // 1. Try to fetch genuine report from backend DB
      try {
        const dbReport = await reportApi.getFilmReport(filmId);
        if (isMounted) {
          setReport(dbReport);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`filmy_report_${filmId}`, JSON.stringify(dbReport));
          }
          setIsFetchingReport(false);
          return;
        }
      } catch (err: unknown) {
        console.log("[FilmReport] Backend DB report not yet ready or fetch failed:", err);
      }

      // 2. Check session storage as fast cache
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem(`filmy_report_${filmId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (isMounted) {
              setReport(normalizeReport(parsed));
              setIsFetchingReport(false);
              return;
            }
          } catch (_) {}
        }
      }

      // 3. Fallback: If movie is loaded, trigger direct generation
      if (movie) {
        try {
          const generated = await reportApi.generateReport({
            film_id: filmId,
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
          });

          if (isMounted) {
            setReport(generated);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`filmy_report_${filmId}`, JSON.stringify(generated));
            }
          }
        } catch (genErr: unknown) {
          if (isMounted) {
            setReportError(
              genErr instanceof Error
                ? genErr.message
                : "Unable to retrieve or generate film report."
            );
          }
        } finally {
          if (isMounted) setIsFetchingReport(false);
        }
      } else {
        if (isMounted) setIsFetchingReport(false);
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [filmId, movie]);

  if (isMovieLoading || (isFetchingReport && !report)) {
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
          title="Film Unavailable"
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
          title="Intelligence Report Generating or Unavailable"
          message={reportError || "The analysis pipeline is still processing or encountered an issue. Please verify in the processing monitor."}
          onRetry={() => window.location.reload()}
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
          <ScenePointsSection report={report} />
          <SceneTimelineSection report={report} />
          <CastPerformanceSection report={report} />
          <PacingAndJourneySection report={report} />
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
