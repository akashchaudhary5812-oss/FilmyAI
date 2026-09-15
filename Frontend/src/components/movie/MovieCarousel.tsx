"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/types/movie";
import { MovieCard } from "./MovieCard";

interface MovieCarouselProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
}

export function MovieCarousel({ title, subtitle, movies }: MovieCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    const targetScroll =
      direction === "left"
        ? scrollLeft - scrollAmount
        : scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll("left")}
            className="p-2 rounded-full bg-cinematic-800 text-slate-300 hover:text-white hover:bg-cinematic-700 border border-white/10 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-2 rounded-full bg-cinematic-800 text-slate-300 hover:text-white hover:bg-cinematic-700 border border-white/10 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1"
      >
        {movies.map((movie, idx) => (
          <MovieCard key={movie.id || idx} movie={movie} />
        ))}
      </div>
    </section>
  );
}
