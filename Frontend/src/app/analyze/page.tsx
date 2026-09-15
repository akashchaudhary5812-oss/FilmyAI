"use client";

import React from "react";
import { Sparkles, Clapperboard } from "lucide-react";
import { FilmUploadForm } from "@/components/analysis/FilmUploadForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AnalyzeFilmPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold-400">
            <Sparkles className="w-4 h-4" />
            <span>Multimodal Film Intelligence Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
            Analyze Film & Generate Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Ingest your film reel or poster with production specifications to execute video shot breakdown, ML commercial success prediction, and studio-grade script synthesis.
          </p>
        </div>

        {/* Upload Form */}
        <FilmUploadForm />
      </div>
    </ProtectedRoute>
  );
}
