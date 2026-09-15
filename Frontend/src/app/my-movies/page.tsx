"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clapperboard, Sparkles, Plus, Bookmark } from "lucide-react";
import { movieApi } from "@/lib/api/movies";
import { Movie } from "@/types/movie";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MyMoviesPage() {
  return (
    <ProtectedRoute>
      <MyMoviesContent />
    </ProtectedRoute>
  );
}

function MyMoviesContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"uploads" | "saved">("uploads");
  const [savedMovieIds, setSavedMovieIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(
        localStorage.getItem("filmy_saved_movies") || "[]"
      ) as string[];
      setSavedMovieIds(saved);
    }
  }, []);

  const { data: allMovies = [], isLoading } = useQuery({
    queryKey: ["all-movies"],
    queryFn: () => movieApi.getAllMovies(),
  });

  // Filter saved movies
  const savedMovies = allMovies.filter((m) => savedMovieIds.includes(m.id));

  // User uploaded movies (using the film catalog)
  const uploadedMovies = allMovies;

  const currentList = activeTab === "uploads" ? uploadedMovies : savedMovies;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold-400">
            <Clapperboard className="w-4 h-4" />
            <span>Studio Production Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
            My Studio Films & Archives
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Workspace belonging to <span className="text-white font-semibold">{user?.username}</span> ({user?.email})
          </p>
        </div>

        <Link href="/analyze">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Upload New Film</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "uploads"
              ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          <span>Uploaded Productions ({uploadedMovies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "saved"
              ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Watchlist ({savedMovies.length})</span>
        </button>
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <MovieGrid
          movies={currentList}
          emptyTitle={
            activeTab === "uploads"
              ? "No Uploaded Films Yet"
              : "No Saved Films in Watchlist"
          }
          emptyDescription={
            activeTab === "uploads"
              ? "Upload a film to begin automated video intelligence, commercial forecasting, and script synthesis."
              : "Click 'Save to My Movies' on any film details page to pin it here."
          }
        />
      )}
    </div>
  );
}
