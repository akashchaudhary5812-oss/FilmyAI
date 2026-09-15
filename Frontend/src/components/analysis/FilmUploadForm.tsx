"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FilmGenre } from "@/types/movie";
import { Dropzone } from "./Dropzone";
import { Button } from "../ui/Button";
import { filmApi } from "@/lib/api/films";
import { Sparkles, Clapperboard, AlertCircle } from "lucide-react";

export function FilmUploadForm() {
  const router = useRouter();

  // Form states matching UploadFilm backend model
  const [filmFile, setFilmFile] = useState<File | null>(null);
  const [filmName, setFilmName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [productionHouses, setProductionHouses] = useState("");
  const [casting, setCasting] = useState("");
  const [budget, setBudget] = useState("");
  const [genre, setGenre] = useState<FilmGenre>("Action");
  const [script, setScript] = useState("");
  const [summary, setSummary] = useState("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!filmFile) {
      setError("Please attach a film video clip or keyframe artwork.");
      return;
    }

    if (!filmName || !directorName || !casting || !budget || !productionHouses) {
      setError("Please complete all required film metadata fields.");
      return;
    }

    try {
      setIsUploading(true);
      const result = await filmApi.uploadFilm(
        {
          filmFile,
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
          setUploadProgress(percent);
        }
      );

      // Successfully uploaded to MongoDB & ImageKit, navigate to processing visualizer
      router.push(`/processing/${result.film.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Film upload failed. Check network.";
      setError(msg);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Media Ingestion Box */}
      <div className="space-y-2">
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
          Film Video Reel or Studio Keyframe Artwork <span className="text-gold-400">*</span>
        </label>
        <Dropzone
          selectedFile={filmFile}
          onFileSelect={setFilmFile}
          progress={uploadProgress}
          isUploading={isUploading}
        />
      </div>

      {/* Primary Metadata Form */}
      <div className="p-6 rounded-2xl glass-panel space-y-6">
        <h3 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-white/10 pb-3">
          <Clapperboard className="w-4 h-4 text-gold-400" />
          <span>Production Specifications</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Film Title <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={filmName}
              onChange={(e) => setFilmName(e.target.value)}
              placeholder="e.g. Oppenheimer"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Director Name <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              placeholder="e.g. Christopher Nolan"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Genre <span className="text-gold-400">*</span>
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as FilmGenre)}
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
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
              Production Budget <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. $100,000,000"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Principal Casting & Ensembles <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={casting}
              onChange={(e) => setCasting(e.target.value)}
              placeholder="e.g. Cillian Murphy, Emily Blunt, Matt Damon"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Production Houses / Studios <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              value={productionHouses}
              onChange={(e) => setProductionHouses(e.target.value)}
              placeholder="e.g. Syncopy, Universal Pictures"
              required
              className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Narrative & Script Inputs (Optional / Recommended) */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white font-display">
            Story, Script & Synopsis
          </h3>
          <span className="text-xs text-gold-400 font-mono">Recommended for LLM Intelligence</span>
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
            className="w-full bg-cinematic-950/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors resize-none"
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
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isUploading}
          className="min-w-[200px]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          <span>Launch AI Analysis</span>
        </Button>
      </div>
    </form>
  );
}
