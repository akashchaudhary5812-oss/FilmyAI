import { BackendMovieDoc, Movie } from "@/types/movie";

/**
 * Transforms a raw Backend Movie Document from MongoDB into a clean frontend Movie model.
 */
export function mapBackendMovieToMovie(doc: BackendMovieDoc): Movie {
  const prodHouses = Array.isArray(doc.ProductionHouses)
    ? doc.ProductionHouses
    : typeof doc.ProductionHouses === "string" && doc.ProductionHouses
    ? doc.ProductionHouses.split(",").map((s) => s.trim())
    : [];

  // Use the uploaded ImageKit image URL as the poster and backdrop
  const mediaUrl = doc.uploadFilm || "";

  return {
    id: doc._id,
    title: doc.FilmName || "Untitled Film",
    posterUrl: mediaUrl,
    backdropUrl: mediaUrl,
    videoUrl: mediaUrl,
    director: doc.DirectorName || "Unknown Director",
    productionHouses: prodHouses,
    casting: doc.Casting || "Not listed",
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
    rating: 8.8, // Default baseline rating for studio catalog
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
