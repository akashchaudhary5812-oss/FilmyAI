import { apiClient } from "./client";
import { BackendMovieDoc, Movie } from "@/types/movie";
import { mapBackendMovieToMovie, mapBackendMoviesToMovies } from "../adapters/movieAdapter";

interface AllMoviesResponse {
  allMovies: boolean;
  movies: BackendMovieDoc[];
}

interface SingleMovieResponse {
  filmFound: boolean;
  film: BackendMovieDoc;
}

interface DeleteMovieResponse {
  filmDeleted: boolean;
  film: BackendMovieDoc;
}

export const movieApi = {
  /**
   * Fetch all movies from backend: GET /api/All_movies
   */
  async getAllMovies(): Promise<Movie[]> {
    const response = await apiClient.get<AllMoviesResponse>("/api/All_movies");
    return mapBackendMoviesToMovies(response.data.movies || []);
  },

  /**
   * Fetch a single movie by its MongoDB ObjectId: GET /api/movie/:id
   */
  async getMovieDetails(id: string): Promise<Movie> {
    const response = await apiClient.get<SingleMovieResponse>(`/api/movie/${id}`);
    if (!response.data.film) {
      throw new Error("Movie not found");
    }
    return mapBackendMovieToMovie(response.data.film);
  },

  /**
   * Delete a movie: DELETE /api/movie/:id
   */
  async deleteMovie(id: string): Promise<Movie> {
    const response = await apiClient.delete<DeleteMovieResponse>(`/api/movie/${id}`);
    return mapBackendMovieToMovie(response.data.film);
  },
};
