"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Sparkles, Film, ArrowRight, Clapperboard } from "lucide-react";
import { Movie } from "@/types/movie";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface MovieHeroProps {
  movie?: Movie;
}

export function MovieHero({ movie }: MovieHeroProps) {
  const [imageError, setImageError] = useState(false);

  if (!movie) {
    return (
      <div className="relative w-full h-[60vh] min-h-[480px] max-h-[680px] bg-cinematic-950 flex items-center justify-center border-b border-white/10">
        <div className="text-center px-4 max-w-xl">
          <Badge variant="gold" className="mb-4">
            AI Cinema Intelligence
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black text-white font-display tracking-tight mb-4">
            Discover Cinema with <span className="gold-gradient-text">Predictive AI</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            Multimodal video analysis, ML commercial viability forecasting, and automated studio intelligence reports.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/analyze">
              <Button variant="primary" size="lg">
                <Sparkles className="w-4 h-4 mr-1" /> Analyze Your Film
              </Button>
            </Link>
            <Link href="/movies">
              <Button variant="secondary" size="lg">
                Explore Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const synopsis = movie.summary?.replace(/\s+/g, " ").trim() ||
    `A high-caliber production with a verified budget of ${movie.budget}. Evaluated by the Filmy AI neural engine for market reach and creative execution.`;

  const isVideo =
    typeof movie.backdropUrl === "string" &&
    (/\.(mp4|webm|mov|mkv|avi)$/i.test(movie.backdropUrl.split("?")[0]) ||
      movie.backdropUrl.includes("/uploads/videos/"));

  return (
    <div className="relative w-full h-[70vh] min-h-[520px] max-h-[720px] overflow-hidden select-none bg-cinematic-950">
      {/* Background Media Backdrop */}
      {movie.backdropUrl && !isVideo && !imageError ? (
        <div className="absolute inset-0">
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover object-center opacity-40 filter brightness-90 contrast-110"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cinematic-900 via-cinematic-950 to-black opacity-80" />
      )}

      {/* Cinematic Multi-Layer Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-cinematic-950 via-cinematic-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-cinematic-950 via-cinematic-950/80 to-transparent w-full md:w-3/4" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">Trending Spotlight</Badge>
            <Badge variant="neural">{movie.genre}</Badge>
            {movie.rating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cinematic-900/90 text-gold-400 border border-gold-500/30 backdrop-blur-md">
                <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                <span>{movie.rating} Studio Rating</span>
              </span>
            )}
            {movie.year && (
              <span className="text-xs text-slate-400 font-mono">
                Released {movie.year}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h1>

          {/* Director & Cast Subtext */}
          <div className="text-sm text-slate-300 font-medium">
            <span className="text-slate-400">Directed by</span>{" "}
            <span className="text-white">{movie.director}</span>
            {movie.casting && (
              <>
                <span className="mx-2 text-slate-600">•</span>
                <span className="text-slate-400">Starring</span>{" "}
                <span className="text-slate-200">{movie.casting}</span>
              </>
            )}
          </div>

          {/* Synopsis */}
          <p
            className="max-w-xl text-sm sm:text-base text-slate-300 line-clamp-3 drop-shadow"
            style={{ lineHeight: "1.75rem" }}
          >
            {synopsis}
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/movies/${movie.id}`}>
              <Button variant="primary" size="lg">
                <span>View Details</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link href={`/film-report/${movie.id}`}>
              <Button variant="neural" size="lg">
                <Sparkles className="w-4 h-4 mr-1" />
                <span>AI Intelligence Report</span>
              </Button>
            </Link>

            <Link href="/analyze">
              <Button variant="outline" size="lg">
                <Clapperboard className="w-4 h-4 mr-1" />
                <span>Analyze New Film</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
