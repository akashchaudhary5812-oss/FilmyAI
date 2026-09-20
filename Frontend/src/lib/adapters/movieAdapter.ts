import { BackendMovieDoc, Movie } from "@/types/movie";

/**
 * Extracts the real model-predicted rating from report or raw ML predictions.
 * Returns undefined if no real model prediction is available yet.
 */
export function extractModelRating(doc: BackendMovieDoc): number | undefined {
  if (doc.report) {
    const rawRating =
      doc.report.executive_summary?.overall_film_rating ??
      doc.report.raw_ml_predictions?.predicted_commercial_score;

    if (typeof rawRating === "number" && !isNaN(rawRating) && rawRating > 0) {
      return Number(rawRating.toFixed(1));
    }
  }

  // Fallback to top-level rating if present on doc in any form
  if (
    typeof doc.rating === "number" &&
    !isNaN(doc.rating) &&
    doc.rating > 0
  ) {
    return Number(doc.rating.toFixed(1));
  }

  return undefined;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return `${API_BASE_URL}/${trimmed}`;
}

/**
 * Transforms a raw Backend Movie Document from MongoDB into a clean frontend Movie model.
 */
export function mapBackendMovieToMovie(doc: BackendMovieDoc): Movie {
  const prodHouses = Array.isArray(doc.ProductionHouses)
    ? doc.ProductionHouses
    : typeof doc.ProductionHouses === "string" && doc.ProductionHouses
    ? doc.ProductionHouses.split(",").map((s) => s.trim())
    : [];

  // Use the uploaded banner image URL as the poster/backdrop if available, else mediaUrl
  const mediaUrl = resolveMediaUrl(doc.uploadFilm);
  const bannerUrl = doc.bannerImage ? resolveMediaUrl(doc.bannerImage) : mediaUrl;
  const streamUrl = doc.streamUrl ? resolveMediaUrl(doc.streamUrl) : undefined;

  return {
    id: doc._id,
    title: doc.FilmName || "Untitled Film",
    posterUrl: bannerUrl,
    backdropUrl: bannerUrl,
    bannerUrl: bannerUrl,
    videoUrl: mediaUrl,
    streamUrl: streamUrl,
    director: doc.DirectorName || "Unknown Director",
    productionHouses: prodHouses,
    casting: doc.Casting || "Not listed",
    castMembers: doc.castMembers || [],
    budget: doc.Budget || "Undisclosed",
    genre: doc.Genre || "Drama",
    script: doc.Script || "",
    summary: doc.Summary || "",
    processingStatus: doc.processingStatus || "PENDING",
    analysisProgress: doc.analysisProgress !== undefined ? doc.analysisProgress : 0,
    ragReady: Boolean(doc.ragReady),
    processingError: doc.processingError,
    timings: doc.timings,
    report: doc.report,
    year: doc.createdAt ? new Date(doc.createdAt).getFullYear() : 2025,
    rating: extractModelRating(doc),
  };
}

/**
 * Transforms an array of raw Backend Movie Documents.
 */
export function mapBackendMoviesToMovies(docs: BackendMovieDoc[]): Movie[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(mapBackendMovieToMovie);
}

/**
 * Filters and categorizes movies by genre
 */
export function filterMoviesByGenre(movies: Movie[], genre: string): Movie[] {
  const normalized = genre.toLowerCase();
  return movies.filter((m) => m.genre.toLowerCase().includes(normalized));
}

/**
 * Search movies locally across title, director, cast, and genre
 */
export function searchMoviesCatalog(movies: Movie[], query: string): Movie[] {
  if (!query || !query.trim()) return movies;
  const q = query.toLowerCase().trim();
  return movies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.genre.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.casting.toLowerCase().includes(q) ||
      (m.summary && m.summary.toLowerCase().includes(q))
  );
}
