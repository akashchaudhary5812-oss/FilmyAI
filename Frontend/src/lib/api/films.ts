import { apiClient, reportClient } from "./client";
import { BackendMovieDoc, FilmUploadPayload, Movie } from "@/types/movie";
import { mapBackendMovieToMovie } from "../adapters/movieAdapter";

interface FilmUploadResponse {
  status: boolean;
  message: string;
  data: BackendMovieDoc;
}

export interface UrlValidationResponse {
  valid: boolean;
  status: string;
  message: string;
  content_type?: string;
  content_length_bytes?: number;
  extension?: string;
  error_type?: string;
}

export const filmApi = {
  /**
   * Upload film video file or register authorized video URL with metadata
   * POST /api/film/uploadFilm
   */
  async uploadFilm(
    payload: FilmUploadPayload,
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; film: Movie }> {
    let response;

    if (payload.filmFile) {
      // Local File Upload mode: multipart/form-data
      const formData = new FormData();
      formData.append("uploadFilm", payload.filmFile);
      formData.append("FilmName", payload.filmName);
      formData.append("DirectorName", payload.directorName);
      formData.append("ProductionHouses", payload.productionHouses);
      formData.append("Casting", payload.casting);
      formData.append("Budget", payload.budget);
      formData.append("Genre", payload.genre);

      if (payload.script) formData.append("Script", payload.script);
      if (payload.summary) formData.append("Summary", payload.summary);

      response = await apiClient.post<FilmUploadResponse>(
        "/api/film/uploadFilm",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percent);
            }
          },
        }
      );
    } else {
      // Video URL mode: application/json
      response = await apiClient.post<FilmUploadResponse>(
        "/api/film/uploadFilm",
        {
          FilmName: payload.filmName,
          uploadFilm: payload.videoUrl,
          videoUrl: payload.videoUrl,
          DirectorName: payload.directorName,
          ProductionHouses: payload.productionHouses,
          Casting: payload.casting,
          Budget: payload.budget,
          Genre: payload.genre,
          Script: payload.script,
          Summary: payload.summary,
        }
      );
    }

    return {
      message: response.data.message,
      film: mapBackendMovieToMovie(response.data.data),
    };
  },

  /**
   * Validates video URL accessibility against FastAPI resolver
   */
  async validateVideoUrl(url: string): Promise<UrlValidationResponse> {
    try {
      const resp = await reportClient.post<UrlValidationResponse>(
        "/api/v1/validate-video-url",
        { url }
      );
      return resp.data;
    } catch (err: any) {
      const errData = err.response?.data;
      return {
        valid: false,
        status: errData?.status || "VALIDATING_URL",
        message: errData?.message || err.message || "Failed to validate video URL.",
        error_type: errData?.error_type,
      };
    }
  },
};
