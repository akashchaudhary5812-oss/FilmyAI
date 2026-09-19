export type FilmGenre =
  | "Action"
  | "Comedy"
  | "Drama"
  | "Horror"
  | "Romance"
  | "Sci-Fi"
  | "Thriller"
  | "Other";

export interface CastMember {
  actorName: string;
  characterName?: string | null;
  imageUrl?: string | null;
  imageId?: string | null;
}

export interface CastMemberUploadInput {
  id: string;
  actorName: string;
  characterName?: string;
  imageFile: File | null;
  imagePreviewUrl?: string;
}

/** Raw document directly returned by Node.js MongoDB UploadFilm model */
export interface BackendMovieDoc {
  _id: string;
  uploadFilm: string;
  bannerImage?: string | null;
  CastImage?: string | null;
  castMembers?: CastMember[];
  FilmName: string;
  DirectorName: string;
  ProductionHouses: string[] | string;
  Casting: string;
  Budget: string;
  Genre: FilmGenre | string;
  Script?: string;
  Summary?: string;
  processingStatus?: string;
  analysisProgress?: number;
  ragReady?: boolean;
  processingError?: string;
  timings?: Record<string, number>;
  report?: any;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

/** Clean normalized frontend Movie model for UI presentation */
export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  bannerUrl?: string;
  videoUrl?: string;
  director: string;
  productionHouses: string[];
  casting: string;
  castMembers?: CastMember[];
  budget: string;
  genre: string;
  script?: string;
  summary?: string;
  processingStatus?: string;
  analysisProgress?: number;
  ragReady?: boolean;
  processingError?: string;
  timings?: Record<string, number>;
  report?: any;
  rating?: number;
  year?: number;
}

export interface WatchHistoryItem {
  movieId: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  genre: string;
  director: string;
  progressSeconds: number;
  durationSeconds: number;
  progressPercent: number;
  lastWatchedAt: number;
}

export type VideoInputType = "upload" | "url";

export interface FilmUploadPayload {
  filmFile?: File | null;
  videoUrl?: string;
  bannerFile?: File | null;
  bannerUrl?: string;
  filmName: string;
  directorName: string;
  productionHouses: string;
  casting: string;
  castMembers?: {
    actorName: string;
    characterName?: string;
    imageFile?: File | null;
    imageUrl?: string;
  }[];
  budget: string;
  genre: FilmGenre;
  script?: string;
  summary?: string;
}

