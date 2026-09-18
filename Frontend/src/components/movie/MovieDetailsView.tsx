"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clapperboard,
  Calendar,
  DollarSign,
  Users,
  Building,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Movie } from "@/types/movie";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { movieApi } from "@/lib/api/movies";
import { useAuth } from "@/context/AuthContext";

interface MovieDetailsViewProps {
  movie: Movie;
}

export function MovieDetailsView({ movie }: MovieDetailsViewProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if media is a video file by extension or upload path
  const isVideo =
    typeof movie.posterUrl === "string" &&
    (/\.(mp4|webm|mov|mkv|avi)$/i.test(movie.posterUrl.split("?")[0]) ||
      movie.posterUrl.includes("/uploads/videos/"));

  const toggleBookmark = () => {
    setIsSaved(!isSaved);
    // Persist in localStorage for user session
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("filmy_saved_movies") || "[]") as string[];
      if (isSaved) {
        const filtered = saved.filter((id) => id !== movie.id);
        localStorage.setItem("filmy_saved_movies", JSON.stringify(filtered));
      } else {
        if (!saved.includes(movie.id)) {
          saved.push(movie.id);
          localStorage.setItem("filmy_saved_movies", JSON.stringify(saved));
        }
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await movieApi.deleteMovie(movie.id);
      router.push("/movies");
    } catch (err) {
      alert("Failed to delete movie: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinematic-950 pb-20">
      {/* Hero Media Section */}
      <div className="relative w-full h-[55vh] min-h-[420px] bg-cinematic-900 overflow-hidden">
        {isVideo ? (
          <video
            src={movie.posterUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : movie.backdropUrl && !imageError ? (
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover filter brightness-75 contrast-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-cinematic-900 via-cinematic-850 to-cinematic-950 flex items-center justify-center">
            <Clapperboard className="w-20 h-20 text-gold-500/20" />
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinematic-950 via-cinematic-950/60 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Poster & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative aspect-[2/3] w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-cinematic-900">
              {movie.posterUrl && !isVideo && !imageError ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-cinematic-900">
                  <Clapperboard className="w-16 h-16 text-gold-400/40 mb-3" />
                  <span className="text-sm font-bold text-white">{movie.title}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 max-w-sm mx-auto">
              <Link href={`/film-report/${movie.id}`} className="block">
                <Button variant="primary" className="w-full py-3.5 text-base">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View AI Film Intelligence
                </Button>
              </Link>

              {isAuthenticated && (
                <Button
                  variant={isSaved ? "secondary" : "outline"}
                  onClick={toggleBookmark}
                  className="w-full"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2 text-gold-400" />
                      In My Movies
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save to My Movies
                    </>
                  )}
                </Button>
              )}

              {/* Admin / Owner Delete action */}
              {deleteConfirm ? (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl space-y-2">
                  <p className="text-xs text-red-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Permanently delete this film from database?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      isLoading={isDeleting}
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Film Record
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Deep Metadata and Synopsis */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="gold">{movie.genre}</Badge>
                <Badge variant="dark">Studio Release</Badge>
                {movie.year && (
                  <span className="text-xs text-slate-400 font-mono">
                    {movie.year}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
                {movie.title}
              </h1>

              <p className="text-base text-gold-400 font-medium mt-1">
                A film directed by {movie.director}
              </p>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-panel flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-slate-400">Cast & Ensembles</h4>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{movie.casting}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl glass-panel flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-slate-400">Production Budget</h4>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{movie.budget}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl glass-panel flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-neural-500/10 text-neural-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-slate-400">Production Houses</h4>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">
                    {movie.productionHouses?.length ? movie.productionHouses.join(", ") : "Independent"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl glass-panel flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-mono text-slate-400">Studio Index</h4>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">ID: {movie.id.substring(0, 10)}...</p>
                </div>
              </div>
            </div>

            {/* Summary / Logline */}
            <div className="p-6 rounded-2xl glass-panel space-y-3">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-400" />
                <span>Synopsis & Overview</span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {movie.summary ||
                  "No synopsis was provided for this film during upload. Run an AI Film Intelligence report to synthesize an executive overview and scene breakdown."}
              </p>
            </div>

            {/* Script Excerpt if present */}
            {movie.script && (
              <div className="p-6 rounded-2xl glass-panel space-y-3">
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-neural-400" />
                  <span>Screenplay & Script Excerpt</span>
                </h3>
                <div className="bg-cinematic-950 p-4 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto border border-white/5">
                  {movie.script}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
