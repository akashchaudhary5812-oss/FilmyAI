export type FilmGenre =
  | "Action"
  | "Comedy"
  | "Drama"
  | "Horror"
  | "Romance"
  | "Sci-Fi"
  | "Thriller"
  | "Other";

/** Raw document directly returned by Node.js MongoDB UploadFilm model */
export interface BackendMovieDoc {
  _id: string;
  uploadFilm: string;
  FilmName: string;
  DirectorName: string;
  ProductionHouses: string[] | string;
  Casting: string;
  Budget: string;
  Genre: FilmGenre | string;
  Script?: string;
  Summary?: string;
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
  director: string;
  productionHouses: string[];
  casting: string;
  budget: string;
  genre: string;
  script?: string;
  summary?: string;
  rating?: number;
  year?: number;
}

export type VideoInputType = "upload" | "url";

export interface FilmUploadPayload {
  filmFile?: File | null;
  videoUrl?: string;
  filmName: string;
  directorName: string;
  productionHouses: string;
  casting: string;
  budget: string;
  genre: FilmGenre;
  script?: string;
  summary?: string;
}
