"use client";

import React, { useState } from "react";
import {
  Download,
  Star,
  Calendar,
  ShieldCheck,
  User,
  Clapperboard,
  DollarSign,
  Tag,
  Printer,
  Share2,
  Check,
  Sparkles,
  Camera,
  Zap,
  BarChart3,
  Users,
  Compass,
  TrendingUp,
  Building2,
  Lightbulb,
} from "lucide-react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Movie } from "@/types/movie";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { reportApi } from "@/lib/api/reports";

interface ReportHeaderProps {
  report: FinalFilmIntelligenceReport;
  movie?: Movie | null;
}

export function ReportHeader({ report, movie }: ReportHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const meta = (report.metadata_summary || {}) as {
    director?: string;
    actors?: string[];
    budget?: number | string;
    genre?: string;
    release_year?: number;
    release_month?: number;
    is_sequel?: boolean;
    production_houses?: string[] | string;
    poster_url?: string;
    backdrop_url?: string;
  };

  const filmTitle = report.film_title || movie?.title || "Untitled Production";
  const director = meta.director || movie?.director;
  const genre = meta.genre || movie?.genre;
  const logline = report.executive_summary?.logline;
  const commercialVerdict =
    report.executive_summary?.commercial_verdict ||
    report.executive_summary?.commercial_tier ||
    "Commercial Forecast";
  const overallRating: number | null =
    report.executive_summary?.overall_film_rating ??
    (report.raw_ml_predictions as any)?.predicted_commercial_score ??
    null;

  // Resolve poster & backdrop dynamically with robust fallbacks
  const rawPoster =
    movie?.posterUrl ||
    (movie?.bannerUrl ? movie.bannerUrl : null) ||
    meta.poster_url ||
    null;

  const isVideo =
    typeof rawPoster === "string" &&
    (/\.(mp4|webm|mov|mkv|avi)$/i.test(rawPoster.split("?")[0]) ||
      rawPoster.includes("/uploads/videos/"));

  const posterUrl = !isVideo ? rawPoster : null;

  const backdropUrl =
    movie?.backdropUrl ||
    meta.backdrop_url ||
    null;

  // Resolve actors
  const actorsList: string[] = Array.isArray(meta.actors) && meta.actors.length > 0
    ? meta.actors
    : movie?.casting
    ? movie.casting.split(",").map((s) => s.trim())
    : [];

  // Resolve production houses
  const prodHouses =
    movie?.productionHouses && movie.productionHouses.length > 0
      ? movie.productionHouses.join(", ")
      : Array.isArray(meta.production_houses)
      ? meta.production_houses.join(", ")
      : typeof meta.production_houses === "string"
      ? meta.production_houses
      : null;

  // Format budget dynamically & gracefully
  const formatBudget = (raw: any): string | null => {
    if (raw === undefined || raw === null || raw === "" || raw === 0) return null;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("$") || trimmed.includes("M") || trimmed.includes("Cr") || trimmed.includes("B")) {
        return trimmed;
      }
      const parsed = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) raw = parsed;
      else return trimmed;
    }
    if (typeof raw === "number") {
      if (raw >= 1_000_000_000) return `$${(raw / 1_000_000_000).toFixed(1)}B`;
      if (raw >= 1_000_000) return `$${(raw / 1_000_000).toFixed(0)}M`;
      if (raw >= 1_000) return `$${(raw / 1_000).toFixed(0)}K`;
      return `$${raw.toLocaleString()}`;
    }
    return String(raw);
  };

  const budgetDisplay = formatBudget(meta.budget ?? movie?.budget);

  // Dynamic Tier Aura & Color Palette
  const getVerdictTheme = (v: string) => {
    const lower = v.toLowerCase();
    if (lower.includes("super hit") || lower.includes("blockbuster")) {
      return {
        badgeVariant: "netflix" as const,
        badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        glowColor: "from-purple-600/20 via-pink-600/10 to-transparent",
        scoreBoxBg: "from-purple-600 to-indigo-600",
        scoreBorder: "border-purple-500/50",
        textAccent: "text-purple-400",
        dotColor: "bg-purple-400",
      };
    }
    if (lower.includes("hit") && !lower.includes("average")) {
      return {
        badgeVariant: "success" as const,
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        glowColor: "from-emerald-600/20 via-teal-600/10 to-transparent",
        scoreBoxBg: "from-emerald-600 to-teal-500",
        scoreBorder: "border-emerald-500/50",
        textAccent: "text-emerald-400",
        dotColor: "bg-emerald-400",
      };
    }
    if (lower.includes("average") || lower.includes("moderate")) {
      return {
        badgeVariant: "gold" as const,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        glowColor: "from-amber-600/20 via-yellow-600/10 to-transparent",
        scoreBoxBg: "from-amber-600 to-yellow-500",
        scoreBorder: "border-amber-500/50",
        textAccent: "text-amber-400",
        dotColor: "bg-amber-400",
      };
    }
    return {
      badgeVariant: "danger" as const,
      badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      glowColor: "from-rose-600/20 via-red-600/10 to-transparent",
      scoreBoxBg: "from-rose-600 to-netflix-600",
      scoreBorder: "border-rose-500/50",
      textAccent: "text-rose-400",
      dotColor: "bg-rose-400",
    };
  };

  const theme = getVerdictTheme(commercialVerdict);

  const downloadPdf = () => {
    if (report.pdf_report_path) {
      const parts = report.pdf_report_path.split(/[\\/]/);
      const filename = parts[parts.length - 1];
      const url = reportApi.getPdfDownloadUrl(filename);
      window.open(url, "_blank");
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickNav = [
    { id: "section-executive", label: "Executive Brief", icon: Sparkles },
    { id: "section-cinematography", label: "Cinematography", icon: Camera },
    { id: "section-scene-hierarchy", label: "Scene Hierarchy", icon: Zap },
    { id: "section-timeline", label: "Timeline", icon: BarChart3 },
    { id: "section-cast", label: "Cast & Performance", icon: Users },
    { id: "section-pacing", label: "Pacing & Arcs", icon: Compass },
    { id: "section-commercial", label: "Commercial Forecast", icon: TrendingUp },
    { id: "section-strategy", label: "Strategic Roadmap", icon: Lightbulb },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl transition-all">
      {/* Dynamic Ambient Backdrop Blur */}
      {backdropUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-2xl pointer-events-none scale-110"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      ) : (
        <div
          className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial ${theme.glowColor} rounded-full filter blur-3xl pointer-events-none opacity-60`}
        />
      )}

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cinematic-950/60 via-cinematic-950/90 to-cinematic-950 pointer-events-none" />

      {/* Main Header Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Poster + Film Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-6 max-w-4xl">
            {/* Dynamic Film Poster Frame (renders when a valid poster image exists) */}
            {posterUrl && !imageError && (
              <div className="w-28 sm:w-36 md:w-44 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative group bg-cinematic-900 ring-1 ring-white/10">
                <img
                  src={posterUrl}
                  alt={`${filmTitle} — Official Film Poster`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Title & Core Metadata */}
            <div className="space-y-3.5 flex-1">
              {/* Studio Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-netflix-500/15 text-netflix-400 border border-netflix-500/30 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-netflix-400 animate-pulse" />
                  Validated Studio Intelligence
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border ${theme.badgeClass} shadow-sm`}
                >
                  <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
                  {commercialVerdict}
                </span>

                <span className="text-xs text-slate-400 font-mono flex items-center gap-1 ml-auto sm:ml-0 bg-cinematic-900/80 px-2.5 py-1 rounded-lg border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {report.generated_at_utc
                    ? new Date(report.generated_at_utc).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                </span>
              </div>

              {/* Film Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-tight">
                {filmTitle}
              </h1>

              {/* Logline Quote */}
              {logline && (
                <p className="text-sm sm:text-base text-slate-300 italic font-normal leading-relaxed max-w-2xl border-l-2 border-netflix-500/60 pl-3.5 py-0.5">
                  &ldquo;{logline}&rdquo;
                </p>
              )}

              {/* Key Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-300">
                {director && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/20 transition-all shadow-sm">
                    <User className="w-3.5 h-3.5 text-netflix-400" />
                    <span>
                      Dir: <strong className="text-white">{director}</strong>
                    </span>
                  </span>
                )}

                {genre && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/20 transition-all shadow-sm">
                    <Tag className="w-3.5 h-3.5 text-prime-400" />
                    <span>
                      Genre: <strong className="text-white">{genre}</strong>
                    </span>
                  </span>
                )}

                {budgetDisplay && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/20 transition-all shadow-sm">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Budget: <strong className="text-white">{budgetDisplay}</strong>
                    </span>
                  </span>
                )}

                {(meta.release_year || movie?.year) && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/20 transition-all shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Release:{" "}
                      <strong className="text-white">
                        {meta.release_month ? `${meta.release_month}/` : ""}
                        {meta.release_year || movie?.year}
                      </strong>
                    </span>
                  </span>
                )}

                {prodHouses && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/20 transition-all shadow-sm">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate max-w-xs">
                      Studio: <strong className="text-white">{prodHouses}</strong>
                    </span>
                  </span>
                )}
              </div>

              {/* Cast Strip */}
              {actorsList.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 pt-0.5">
                  <Clapperboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Key Cast:</span>
                  <span className="text-white font-medium truncate max-w-xl">
                    {actorsList.slice(0, 5).join(", ")}
                    {actorsList.length > 5 && (
                      <span className="text-slate-400 ml-1">
                        +{actorsList.length - 5} more
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Report Verification Hash */}
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-cinematic-950/60 px-2.5 py-1 rounded-md border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Report ID:{" "}
                  <span className="text-slate-300 font-semibold">
                    {report.report_id || "FILMY-VALIDATED"}
                  </span>
                </span>
                {report.report_version && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    v{report.report_version}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Composite Score Card & Studio Action Hub */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-between gap-4 shrink-0">
            {/* High-End Studio Score Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl bg-cinematic-900/90 border ${theme.scoreBorder} shadow-2xl flex items-center justify-between gap-5 relative overflow-hidden backdrop-blur-md`}
            >
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
                  Composite Intelligence Rating
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider block ${theme.textAccent}`}>
                  {commercialVerdict}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block">
                  Commercial & Multimodal Synthesis
                </span>
              </div>

              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${theme.scoreBoxBg} flex flex-col items-center justify-center text-white shadow-xl shrink-0 ring-2 ring-white/20`}
              >
                {overallRating !== null ? (
                  <>
                    <div className="flex items-center gap-1 text-xl sm:text-2xl font-black">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      <span>{overallRating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      / 10 Scale
                    </span>
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 fill-white opacity-80" />
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 mt-1">
                      ML Score
                    </span>
                    <span className="text-[10px] font-mono opacity-70">Pending</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button
                variant="primary"
                onClick={downloadPdf}
                size="md"
                className="gap-2 shadow-lg shadow-netflix-500/20 font-display font-semibold text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Studio PDF</span>
              </Button>

              <button
                onClick={() => window.print()}
                title="Print Executive Dossier"
                className="p-2.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                title="Share Dossier Link"
                className="p-2.5 rounded-xl bg-cinematic-900/90 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-1 text-xs font-mono"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section Jump Navigation Bar */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold shrink-0 mr-2 flex items-center gap-1">
              <span>Jump To Section:</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {quickNav.map((sec) => {
                const Icon = sec.icon;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 bg-cinematic-900/80 hover:bg-cinematic-800 border border-white/5 hover:border-white/20 transition-all whitespace-nowrap shadow-sm hover:text-white active:scale-95"
                  >
                    <Icon className="w-3.5 h-3.5 text-netflix-400" />
                    <span>{sec.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
