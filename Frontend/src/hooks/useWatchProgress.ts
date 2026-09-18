"use client";

import { useState, useEffect, useCallback } from "react";
import { Movie, WatchHistoryItem } from "@/types/movie";

const STORAGE_KEY = "filmy_watch_history";
const EVENT_NAME = "filmy_watch_progress_updated";

/**
 * Retrieve all watch history items from localStorage
 */
export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Get progress for a specific movie
 */
export function getMovieProgress(movieId: string): WatchHistoryItem | null {
  const history = getWatchHistory();
  return history.find((item) => item.movieId === movieId) || null;
}

/**
 * Persist or update progress for a movie
 */
export function persistWatchProgress(
  movie: Pick<Movie, "id" | "title" | "posterUrl" | "backdropUrl" | "genre" | "director">,
  progressSeconds: number,
  durationSeconds: number
): void {
  if (typeof window === "undefined" || !movie.id) return;
  if (!durationSeconds || isNaN(durationSeconds) || durationSeconds <= 0) return;

  const validProgress = Math.max(0, Math.min(progressSeconds, durationSeconds));
  const percent = Math.min(100, Math.round((validProgress / durationSeconds) * 100));

  // If completed (> 95%), we can either remove or keep with 100%
  const history = getWatchHistory().filter((item) => item.movieId !== movie.id);

  if (percent < 95 && validProgress > 3) {
    const newItem: WatchHistoryItem = {
      movieId: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      genre: movie.genre,
      director: movie.director,
      progressSeconds: Math.floor(validProgress),
      durationSeconds: Math.floor(durationSeconds),
      progressPercent: percent,
      lastWatchedAt: Date.now(),
    };
    history.unshift(newItem);
  }

  // Keep latest 20 items
  const trimmed = history.slice(0, 20);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { movieId: movie.id } }));
  } catch (err) {
    console.error("Failed to save watch progress to localStorage", err);
  }
}

/**
 * Remove a movie from watch history
 */
export function removeWatchProgress(movieId: string): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory().filter((item) => item.movieId !== movieId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { movieId } }));
  } catch (err) {
    console.error("Failed to remove watch history item", err);
  }
}

/**
 * Hook to manage watch history in components
 */
export function useWatchProgress(movieId?: string) {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [currentProgress, setCurrentProgress] = useState<WatchHistoryItem | null>(null);

  const refresh = useCallback(() => {
    const all = getWatchHistory();
    setHistory(all);
    if (movieId) {
      const current = all.find((item) => item.movieId === movieId) || null;
      setCurrentProgress(current);
    }
  }, [movieId]);

  useEffect(() => {
    refresh();

    const handleStorageUpdate = () => {
      refresh();
    };

    window.addEventListener(EVENT_NAME, handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [refresh]);

  return {
    watchHistory: history,
    currentProgress,
    saveProgress: (
      movie: Pick<Movie, "id" | "title" | "posterUrl" | "backdropUrl" | "genre" | "director">,
      currentTime: number,
      duration: number
    ) => persistWatchProgress(movie, currentTime, duration),
    removeProgress: removeWatchProgress,
    refresh,
  };
}
