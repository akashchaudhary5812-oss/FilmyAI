import { apiClient, reportClient } from "./client";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { normalizeReport } from "../adapters/reportAdapter";

export interface GenerateReportPayload {
  film_id?: string;
  FilmName: string;
  uploadFilm?: string;
  DirectorName: string;
  Casting?: string;
  ProductionHouses?: string;
  Budget?: string | number;
  Genre?: string;
  Script?: string;
  Summary?: string;
  generate_pdf?: boolean;
}

export interface FilmPipelineStatusResponse {
  status: boolean;
  filmId: string;
  title: string;
  processingStatus: 
    | "PENDING"
    | "VALIDATING_MEDIA"
    | "DOWNLOADING_VIDEO"
    | "ANALYZING_VIDEO"
    | "ANALYZING_COMMERCIAL"
    | "GENERATING_REPORT"
    | "INDEXING_RAG"
    | "COMPLETED"
    | "FAILED";
  analysisProgress: number;
  ragReady: boolean;
  timings?: Record<string, number>;
  error?: string | null;
}

interface FilmReportBackendResponse {
  status: boolean;
  filmId: string;
  report?: FinalFilmIntelligenceReport;
  isProcessing?: boolean;
  processingStatus?: string;
  message?: string;
}

export const reportApi = {
  /**
   * Poll live pipeline processing status from Node.js backend
   * GET /api/film/:id/status
   */
  async getFilmStatus(filmId: string): Promise<FilmPipelineStatusResponse> {
    const response = await apiClient.get<FilmPipelineStatusResponse>(
      `/api/film/${filmId}/status`
    );
    return response.data;
  },

  /**
   * Retrieve genuine completed report persisted in MongoDB
   * GET /api/film/:id/report
   */
  async getFilmReport(filmId: string): Promise<FinalFilmIntelligenceReport> {
    const response = await apiClient.get<FilmReportBackendResponse>(
      `/api/film/${filmId}/report`
    );
    if (!response.data.report) {
      throw new Error(response.data.message || "Film report is still generating or unavailable.");
    }
    return normalizeReport(response.data.report);
  },

  /**
   * Direct Python microservice execution trigger (if running standalone)
   * POST /api/v1/generate-report
   */
  async generateReport(payload: GenerateReportPayload): Promise<FinalFilmIntelligenceReport> {
    const response = await reportClient.post<FinalFilmIntelligenceReport>(
      "/api/v1/generate-report",
      payload
    );
    return normalizeReport(response.data);
  },

  /**
   * Retrieve PDF download URL
   */
  getPdfDownloadUrl(filename: string): string {
    const baseUrl = (process.env.NEXT_PUBLIC_REPORT_API_BASE_URL || "").trim();
    if (!baseUrl) return `#`;
    return `${baseUrl}/api/v1/reports/pdf/${encodeURIComponent(filename)}`;
  },
};
