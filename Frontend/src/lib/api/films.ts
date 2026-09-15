import { apiClient } from "./client";
import { BackendMovieDoc, FilmUploadPayload, Movie } from "@/types/movie";
import { mapBackendMovieToMovie } from "../adapters/movieAdapter";

interface FilmUploadResponse {
  status: boolean;
  message: string;
  data: BackendMovieDoc;
}

export const filmApi = {
  /**
   * Upload film video/poster and metadata
   * POST /api/film/uploadFilm (multipart/form-data)
   */
  async uploadFilm(
    payload: FilmUploadPayload,
    onProgress?: (percent: number) => void
  ): Promise<{ message: string; film: Movie }> {
    const formData = new FormData();

    // The backend uses upload.single("uploadFilm")
    formData.append("uploadFilm", payload.filmFile);

    // Metadata fields matching UploadFilm.model.js
    formData.append("FilmName", payload.filmName);
    formData.append("DirectorName", payload.directorName);
    formData.append("ProductionHouses", payload.productionHouses);
    formData.append("Casting", payload.casting);
    formData.append("Budget", payload.budget);
    formData.append("Genre", payload.genre);

    if (payload.script) {
      formData.append("Script", payload.script);
    }
    if (payload.summary) {
      formData.append("Summary", payload.summary);
    }

    const response = await apiClient.post<FilmUploadResponse>(
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

    return {
      message: response.data.message,
      film: mapBackendMovieToMovie(response.data.data),
    };
  },
};
