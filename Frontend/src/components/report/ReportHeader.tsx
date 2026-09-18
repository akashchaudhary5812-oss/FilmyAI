import React from "react";
import { Download, Sparkles, Star, Calendar, ShieldCheck, User, Clapperboard, DollarSign, Tag } from "lucide-react";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { reportApi } from "@/lib/api/reports";

interface ReportHeaderProps {
  report: FinalFilmIntelligenceReport;
}

export function ReportHeader({ report }: ReportHeaderProps) {
  const meta = (report.metadata_summary || {}) as {
    director?: string;
    actors?: string[];
    budget?: number;
    genre?: string;
    release_year?: number;
    release_month?: number;
    is_sequel?: boolean;
  };

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

  return (
    <div className="p-8 rounded-3xl glass-panel-gold border border-gold-500/25 space-y-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">Validated Studio Intelligence</Badge>
            <Badge variant="neural">{report.executive_summary?.commercial_tier || "Major Studio Tier"}</Badge>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(report.generated_at_utc).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
            {report.film_title}
          </h1>

          <p className="text-sm text-slate-300 italic leading-relaxed">
            &ldquo;{report.executive_summary?.logline}&rdquo;
          </p>

          {/* Film Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-300">
            {meta.director && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cinematic-950/70 border border-white/5">
                <User className="w-3.5 h-3.5 text-gold-400" />
                <span>Dir: <strong className="text-white">{meta.director}</strong></span>
              </span>
            )}
            {meta.genre && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cinematic-950/70 border border-white/5">
                <Tag className="w-3.5 h-3.5 text-neural-400" />
                <span>Genre: <strong className="text-white">{meta.genre}</strong></span>
              </span>
            )}
            {meta.budget !== undefined && meta.budget > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cinematic-950/70 border border-white/5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Budget: <strong className="text-white">${meta.budget.toLocaleString()}</strong></span>
              </span>
            )}
            {meta.release_year && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cinematic-950/70 border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Release: <strong className="text-white">{meta.release_month ? `${meta.release_month}/` : ""}{meta.release_year}</strong></span>
              </span>
            )}
            {meta.actors && meta.actors.length > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cinematic-950/70 border border-white/5">
                <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cast: <strong className="text-white">{meta.actors.join(", ")}</strong></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Report ID: {report.report_id}
            </span>
          </div>
        </div>

        {/* Right side rating badge & download button */}
        <div className="flex flex-col items-start md:items-end gap-4">
          <div className="flex items-center gap-3 bg-cinematic-950/80 p-3.5 rounded-2xl border border-gold-500/30 shadow-lg">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Composite Score
              </span>
              <span className="text-xs font-semibold text-gold-400">
                {report.executive_summary?.commercial_verdict}
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-gold-600 to-amber-400 flex flex-col items-center justify-center text-cinematic-950 shadow-md">
              <div className="flex items-center gap-0.5 text-base font-black">
                <Star className="w-3.5 h-3.5 fill-cinematic-950" />
                <span>{report.executive_summary?.overall_film_rating?.toFixed(1) || "8.5"}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">/ 10</span>
            </div>
          </div>

          <Button variant="secondary" onClick={downloadPdf} size="md" className="gap-2">
            <Download className="w-4 h-4 text-gold-400" />
            <span>Download Studio PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

