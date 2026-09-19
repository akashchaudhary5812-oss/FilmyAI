"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FilmGenre, VideoInputType, CastMemberUploadInput } from "@/types/movie";
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
  ImageIcon,
  UserPlus,
  Trash2,
  Camera,
  X
} from "lucide-react";

export function FilmUploadForm() {
  const router = useRouter();

  // Input Mode: "upload" (Local File) or "url" (Public/Authorized URL)
  const [inputType, setInputType] = useState<VideoInputType>("upload");

  // Local Video State
  const [filmFile, setFilmFile] = useState<File | null>(null);

  // Video URL State
  const [videoUrl, setVideoUrl] = useState("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidationMsg, setUrlValidationMsg] = useState<{
    valid: boolean;
    text: string;
    type?: string;
  } | null>(null);

  // Banner Image State
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");

  // Dynamic Multi-Actor Cast Members State
  const [castMembers, setCastMembers] = useState<CastMemberUploadInput[]>([
    {
      id: "actor_1",
      actorName: "",
      characterName: "",
      imageFile: null,
      imagePreviewUrl: "",
    },
    {
      id: "actor_2",
      actorName: "",
      characterName: "",
      imageFile: null,
      imagePreviewUrl: "",
    },
  ]);

  // Production Metadata States
  const [filmName, setFilmName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [productionHouses, setProductionHouses] = useState("");
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

  // Cast Member management functions
  const handleAddActor = () => {
    const newId = `actor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setCastMembers((prev) => [
      ...prev,
      {
        id: newId,
        actorName: "",
        characterName: "",
        imageFile: null,
        imagePreviewUrl: "",
      },
    ]);
  };

  const handleRemoveActor = (indexToRemove: number) => {
    if (castMembers.length <= 1) return;
    setCastMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleActorChange = (
    index: number,
    field: "actorName" | "characterName",
    value: string
  ) => {
    setCastMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleActorImageChange = (index: number, file: File | null) => {
    if (!file) return;

    // Validate image format
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif"];
    if (!validImageTypes.includes(file.type)) {
      setError(`Invalid image format for actor. Please upload a JPG, PNG, or WebP photo.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCastMembers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        imageFile: file,
        imagePreviewUrl: previewUrl,
      };
      return updated;
    });
  };

  const handleRemoveActorImage = (index: number) => {
    setCastMembers((prev) => {
      const updated = [...prev];
      if (updated[index].imagePreviewUrl) {
        URL.revokeObjectURL(updated[index].imagePreviewUrl || "");
      }
      updated[index] = {
        ...updated[index],
        imageFile: null,
        imagePreviewUrl: "",
      };
      return updated;
    });
  };

  // Banner image handlers
  const handleBannerSelect = (file: File | null) => {
    if (!file) return;
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif"];
    if (!validImageTypes.includes(file.type)) {
      setError("Invalid banner image format. Please select a JPG, PNG, or WebP image.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setBannerFile(file);
    setBannerPreview(preview);
  };

  const handleRemoveBanner = () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(null);
    setBannerPreview(null);
  };

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

    // Filter valid cast members
    const validCastMembers = castMembers.filter((c) => c.actorName && c.actorName.trim());
    if (validCastMembers.length === 0) {
      setError("Please provide at least one actor name in the Casting section.");
      return;
    }

    // Ensure actor rows with images have names, and vice versa
    for (const actor of validCastMembers) {
      if (!actor.actorName.trim()) {
        setError("Every actor row must have a valid actor name.");
        return;
      }
    }

    if (!filmName || !directorName || !budget || !productionHouses) {
      setError("Please complete all required film metadata fields.");
      return;
    }

    // Derive comma-separated casting string for backwards compatibility
    const castingString = validCastMembers.map((c) => c.actorName.trim()).join(", ");

    try {
      setIsSubmitting(true);
      const result = await filmApi.uploadFilm(
        {
          filmFile: inputType === "upload" ? filmFile : null,
          videoUrl: inputType === "url" ? videoUrl.trim() : undefined,
          bannerFile: bannerFile || undefined,
          bannerUrl: bannerUrl.trim() || undefined,
          filmName: filmName.trim(),
          directorName: directorName.trim(),
          productionHouses: productionHouses.trim(),
          casting: castingString,
          castMembers: validCastMembers.map((c) => ({
            actorName: c.actorName.trim(),
            characterName: c.characterName?.trim() || undefined,
            imageFile: c.imageFile,
          })),
          budget: budget.trim(),
          genre,
          script: script.trim() || undefined,
          summary: summary.trim() || undefined,
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

      {/* 1. Video Ingestion Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Film Video Footage <span className="text-netflix-400">*</span>
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
              Direct Stream Ingestion
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Provide a direct public or authorized video URL (e.g. S3, Cloudinary, CDN, or trailer stream). FilmyAI safely streams footage directly into the <code className="text-netflix-400 font-mono">ML_VIDEO</code> pipeline.
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
        </div>
      )}

      {/* 2. Banner Image Upload Section */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gold-400" />
            <span>Film Banner &amp; Poster Image</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Hero Display</span>
        </div>

        <p className="text-xs text-slate-400">
          Upload a high-resolution banner/poster image for the film header and catalog display.
        </p>

        {bannerPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gold-500/30 bg-cinematic-950/90 group">
            <img
              src={bannerPreview}
              alt="Film Banner Preview"
              className="w-full h-44 object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Change Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleBannerSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleRemoveBanner}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/15 hover:border-gold-500/50 rounded-xl p-6 transition-colors text-center bg-cinematic-950/40">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <label className="cursor-pointer text-sm font-semibold text-gold-400 hover:text-gold-300">
                  <span>Choose Banner Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => handleBannerSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports JPG, PNG, WebP (Recommended: 1920x1080 or 16:9 ratio)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CASTING Section with Dynamic Multiple Actors and Image References */}
      <div className="p-6 rounded-2xl glass-panel space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-netflix-400" />
              <span>CASTING</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Provide actor names and reference photos for facial recognition and performance tracking in ML_VIDEO.
            </p>
          </div>

          {/* "+ Add Actor" button in the TOP-RIGHT of casting section */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddActor}
            className="flex items-center gap-1.5 bg-netflix-500/20 hover:bg-netflix-500/30 text-netflix-300 border-netflix-500/30 text-xs font-semibold py-1.5 px-3.5 rounded-xl shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-netflix-400" />
            <span>+ Add Actor</span>
          </Button>
        </div>

        {/* Dynamic Actor Entries */}
        <div className="space-y-4">
          {castMembers.map((actor, idx) => (
            <div
              key={actor.id}
              className="p-4 rounded-xl bg-cinematic-950/80 border border-white/10 hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400">
                  Actor {idx + 1}
                </span>
                {castMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveActor(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-950/30"
                    title="Remove actor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Actor Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Name <span className="text-netflix-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={actor.actorName}
                    onChange={(e) => handleActorChange(idx, "actorName", e.target.value)}
                    placeholder="e.g. Cillian Murphy"
                    required
                    className="w-full bg-cinematic-900/90 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
                  />
                </div>

                {/* Character Name (Optional) */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Character / Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={actor.characterName || ""}
                    onChange={(e) => handleActorChange(idx, "characterName", e.target.value)}
                    placeholder="e.g. J. Robert Oppenheimer"
                    className="w-full bg-cinematic-900/90 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 transition-colors"
                  />
                </div>
              </div>

              {/* Actor Reference Image Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Actor Image (Reference for Computer Vision Recognition)
                </label>

                {actor.imagePreviewUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-cinematic-900/60 rounded-xl border border-white/10">
                    <img
                      src={actor.imagePreviewUrl}
                      alt={`${actor.actorName || "Actor"} preview`}
                      className="w-12 h-12 rounded-lg object-cover border border-gold-500/40 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {actor.imageFile?.name || "Reference Photo"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {actor.imageFile ? `${(actor.imageFile.size / 1024).toFixed(0)} KB` : "Uploaded"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveActorImage(idx)}
                      className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors shrink-0"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-cinematic-900 hover:bg-cinematic-800 border border-white/10 hover:border-gold-500/40 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all">
                      <Camera className="w-3.5 h-3.5 text-gold-400" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleActorImageChange(idx, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Clear headshot for high accuracy actor tracking
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Primary Production Metadata Form */}
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

      {/* 5. Narrative & Script Inputs */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white font-display">
            Story, Script &amp; Synopsis
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

