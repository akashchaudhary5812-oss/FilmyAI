"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FilmGenre, VideoInputType } from "@/types/movie";
import { Dropzone } from "./Dropzone";
import { Button } from "../ui/Button";
import { filmApi } from "@/lib/api/films";
import {
  Sparkles,
  Clapperboard,
  AlertCircle,
  Upload,
  Link2,
  CheckCircle2,
  Loader2,
  Globe,
  ShieldCheck,
  Film
} from "lucide-react";

export function FilmUploadForm() {
  const router = useRouter();

  // Input Mode: "upload" (Local File) or "url" (Public/Authorized URL)
  const [inputType, setInputType] = useState<VideoInputType>("upload");

  // Local File State
  const [filmFile, setFilmFile] = useState<File | null>(null);

  // URL State
  const [videoUrl, setVideoUrl] = useState("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidationMsg, setUrlValidationMsg] = useState<{
    valid: boolean;
    text: string;
    type?: string;
  } | null>(null);

  // Production Metadata States
  const [filmName, setFilmName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [productionHouses, setProductionHouses] = useState("");
  const [casting, setCasting] = useState("");
  const [budget, setBudget] = useState("");
  const [genre, setGenre] = useState<FilmGenre>("Action");
  const [script, setScript] = useState("");
  const [summary, setSummary] = useState("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const genres: FilmGenre[] = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Other",
  ];

  // Helper to validate video URL on blur or button click
  const handleValidateUrl = async (urlToValidate: string) => {
    if (!urlToValidate || !urlToValidate.trim()) {
      setUrlValidationMsg(null);
      return;
    }

    try {
      setIsValidatingUrl(true);
      setUrlValidationMsg(null);
      const res = await filmApi.validateVideoUrl(urlToValidate.trim());
      if (res.valid) {
        setUrlValidationMsg({
          valid: true,
          text: `Verified direct video stream (${res.content_type || "video/mp4"}${
            res.content_length_bytes
              ? `, ${(res.content_length_bytes / (1024 * 1024)).toFixed(1)} MB`
              : ""
          })`,
          type: res.content_type,
        });
      } else {
        setUrlValidationMsg({
          valid: false,
          text: res.message || "Invalid or inaccessible video URL.",
        });
      }
    } catch {
      setUrlValidationMsg({
        valid: false,
        text: "Could not reach video validation service. Proceeding with standard resolution.",
      });
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate video input based on active mode
    if (inputType === "upload") {
      if (!filmFile) {
        setError("Please attach a local film video file (.mp4, .mov, .webm, etc.).");
        return;
      }
    } else {
      if (!videoUrl || !videoUrl.trim()) {
        setError("Please provide a public or authorized direct video URL.");
        return;
      }
      try {
        const parsed = new URL(videoUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setError("Video URL must use HTTP or HTTPS protocol.");
          return;
        }
      } catch {
        setError("Please enter a valid, well-formed video URL.");
        return;
      }
    }

    if (!filmName || !directorName || !casting || !budget || !productionHouses) {
      setError("Please complete all required film metadata fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await filmApi.uploadFilm(
        {
          filmFile: inputType === "upload" ? filmFile : null,
          videoUrl: inputType === "url" ? videoUrl.trim() : undefined,
          filmName,
          directorName,
          productionHouses,
          casting,
          budget,
          genre,
          script,
          summary,
        },
        (percent) => {
          if (inputType === "upload") {
            setUploadProgress(percent);
          }
        }
      );

      // Navigate to processing visualizer
      router.push(`/processing/${result.film.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Film submission failed. Check network.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Video Ingestion Method <span className="text-netflix-400">*</span>
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Unified ML_VIDEO Pipeline
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-1.5 bg-cinematic-950/80 rounded-2xl border border-cinematic-700">
          <button
            type="button"
            onClick={() => {
              setInputType("upload");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              inputType === "upload"
                ? "bg-netflix-500 text-white shadow-lg shadow-netflix-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Video File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputType("url");
              setError("");
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              inputType === "url"
                ? "bg-netflix-500 text-white shadow-lg shadow-netflix-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Enter Video URL</span>
          </button>
        </div>
      </div>

      {/* Dynamic Ingestion Interface */}
      {inputType === "upload" ? (
        <div className="space-y-2 animate-in fade-in duration-200">
          <Dropzone
            selectedFile={filmFile}
            onFileSelect={setFilmFile}
            onFileError={setError}
            progress={uploadProgress}
            isUploading={isSubmitting}
          />
        </div>
      ) : (
        <div className="p-6 rounded-2xl glass-panel border border-cinematic-700 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-prime-400" />
              <h4 className="text-sm font-semibold text-white font-display">
                Public / Authorized Video Stream URL
              </h4>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-prime-500/10 text-prime-400 border border-prime-500/30">
              No Download Required
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Provide a direct public or authorized video URL (e.g. S3, Cloudinary, CDN, or trailer stream). FilmyAI safely streams and caches the footage temporarily into the unified <code className="text-netflix-400 font-mono">ML_VIDEO</code> pipeline.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setUrlValidationMsg(null);
                }}
                onBlur={() => handleValidateUrl(videoUrl)}
                placeholder="https://storage.googleapis.com/sample-videos/cinematic_trailer.mp4"
                className="w-full bg-cinematic-950/90 border border-white/10 rounded-xl py-3 pl-4 pr-28 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors font-mono text-xs"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleValidateUrl(videoUrl)}
                  disabled={isValidatingUrl || !videoUrl.trim()}
                  className="text-xs py-1.5 px-3 h-8"
                >
                  {isValidatingUrl ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Verify</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Validation Feedback */}
            {urlValidationMsg && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                  urlValidationMsg.valid
                    ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                    : "bg-red-950/40 border border-red-500/30 text-red-300"
                }`}
              >
                {urlValidationMsg.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{urlValidationMsg.text}</span>
              </div>
            )}
          </div>

          {/* Supported Formats & Guidelines */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-mono">Formats:</span>
              {[".MP4", ".MOV", ".WEBM", ".MKV", ".AVI", ".MPEG"].map((ext) => (
                <span
                  key={ext}
                  className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300"
                >
                  {ext}
                </span>
              ))}
            </div>
            <span className="text-slate-400 text-[10px]">Max 1GB Stream</span>
          </div>
        </div>
      )}

      {/* Primary Metadata Form */}
      <div className="p-6 rounded-2xl glass-panel space-y-6">
        <h3 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-white/10 pb-3">
          <Clapperboard className="w-4 h-4 text-netflix-400" />
          <span>Production Specifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Film Title <span className="text-netflix-400">*</span>
            </label>
            <input
              type="text"
              value={filmName}
              onChange={(e) => setFilmName(e.target.value)}
              placeholder="e.g. Oppenheimer"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Director Name <span className="text-netflix-400">*</span>
            </label>
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              placeholder="e.g. Christopher Nolan"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Genre <span className="text-netflix-400">*</span>
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as FilmGenre)}
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-prime-500 transition-colors"
            >
              {genres.map((g) => (
                <option key={g} value={g} className="bg-cinematic-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Production Budget <span className="text-netflix-400">*</span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. $100,000,000"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Principal Casting &amp; Ensembles <span className="text-netflix-400">*</span>
            </label>
            <input
              type="text"
              value={casting}
              onChange={(e) => setCasting(e.target.value)}
              placeholder="e.g. Cillian Murphy, Emily Blunt, Matt Damon"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Production Houses / Studios <span className="text-netflix-400">*</span>
            </label>
            <input
              type="text"
              value={productionHouses}
              onChange={(e) => setProductionHouses(e.target.value)}
              placeholder="e.g. Syncopy, Universal Pictures"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Narrative & Script Inputs */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white font-display">
            Story, Script & Synopsis
          </h3>
          <span className="text-xs text-prime-400 font-mono">Recommended for LLM Intelligence</span>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Logline or Narrative Synopsis
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="A gripping historical drama detailing the development of the atomic bomb and its geopolitical aftermath..."
            className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Screenplay Text / Script Excerpt
          </label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={4}
            placeholder="EXT. LOS ALAMOS - DAY\nDr. Oppenheimer stares across the desert horizon as the test tower is erected..."
            className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors font-mono text-xs"
          />
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="min-w-[220px]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          <span>Launch AI Analysis</span>
        </Button>
      </div>
    </form>
  );
}
