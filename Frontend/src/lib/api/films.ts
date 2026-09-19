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

    const hasFiles = Boolean(
      payload.filmFile ||
      payload.bannerFile ||
      (payload.castMembers && payload.castMembers.some((c) => c.imageFile))
    );

    if (hasFiles || payload.filmFile) {
      // Multipart/form-data mode for uploading files
      const formData = new FormData();

      if (payload.filmFile) {
        formData.append("uploadFilm", payload.filmFile);
      } else if (payload.videoUrl) {
        formData.append("uploadFilm", payload.videoUrl);
        formData.append("videoUrl", payload.videoUrl);
      }

      if (payload.bannerFile) {
        formData.append("bannerImage", payload.bannerFile);
      } else if (payload.bannerUrl) {
        formData.append("bannerUrl", payload.bannerUrl);
      }

      // Append cast member reference images and metadata
      const castMetaList: Array<{
        actorName: string;
        characterName?: string;
        imageIndex?: number;
        imageUrl?: string;
      }> = [];

      let fileIdx = 0;
      (payload.castMembers || []).forEach((member) => {
        let assignedIdx: number | undefined = undefined;
        if (member.imageFile) {
          formData.append("CastImage", member.imageFile);
          assignedIdx = fileIdx;
          fileIdx++;
        }
        castMetaList.push({
          actorName: member.actorName,
          characterName: member.characterName || undefined,
          imageIndex: assignedIdx,
          imageUrl: member.imageUrl || undefined,
        });
      });

      formData.append("castMembers", JSON.stringify(castMetaList));
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
      // Pure URL mode: application/json
      response = await apiClient.post<FilmUploadResponse>(
        "/api/film/uploadFilm",
        {
          FilmName: payload.filmName,
          uploadFilm: payload.videoUrl,
          videoUrl: payload.videoUrl,
          bannerImage: payload.bannerUrl,
          bannerUrl: payload.bannerUrl,
          castMembers: payload.castMembers?.map((c) => ({
            actorName: c.actorName,
            characterName: c.characterName,
            imageUrl: c.imageUrl,
          })),
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
