"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Cpu,
  Video,
  FileText,
  BarChart3,
  Sparkles,
  ArrowRight,
  Database,
  Globe,
  Film,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Movie } from "@/types/movie";
import { Button } from "../ui/Button";
import { reportApi, FilmPipelineStatusResponse } from "@/lib/api/reports";

interface ProcessingVisualizerProps {
  movie: Movie;
}

export type ProcessingStateCode =
  | "PENDING"
  | "VALIDATING_MEDIA"
  | "DOWNLOADING_VIDEO"
  | "ANALYZING_VIDEO"
  | "ANALYZING_COMMERCIAL"
  | "GENERATING_REPORT"
  | "INDEXING_RAG"
  | "COMPLETED"
  | "FAILED";

interface PipelineStep {
  stateCode: ProcessingStateCode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function ProcessingVisualizer({ movie }: ProcessingVisualizerProps) {
  const router = useRouter();
  const [activeStateCode, setActiveStateCode] = useState<ProcessingStateCode>("PENDING");
  const [currentProgress, setCurrentProgress] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, number>>({});
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const isUrlSource =
    typeof movie.posterUrl === "string" &&
    (movie.posterUrl.startsWith("http://") || movie.posterUrl.startsWith("https://")) &&
    !movie.posterUrl.includes("localhost") &&
    !movie.posterUrl.includes("127.0.0.1") &&
    !movie.posterUrl.includes("uploads/videos");

  const steps: PipelineStep[] = [
    {
      stateCode: "VALIDATING_MEDIA",
      label: isUrlSource ? "VALIDATING_URL: Video Stream Verification" : "VERIFYING_MEDIA: Ingested Film Buffer Check",
      description: isUrlSource
        ? "Probing remote video stream accessibility, MIME format, and size headers."
        : "Verifying local disk storage integrity and video stream headers.",
      icon: isUrlSource ? <Globe className="w-5 h-5 text-netflix-400" /> : <Video className="w-5 h-5 text-netflix-400" />,
    },
    {
      stateCode: "ANALYZING_VIDEO",
      label: "ML_VIDEO: Multimodal Cinematography & Shot Breakdown",
      description: "Executing shot boundary detection, ResNet/EfficientNet keyframe inference, lighting analysis, and AVA speech classifier.",
      icon: <Cpu className="w-5 h-5 text-neural-400" />,
    },
    {
      stateCode: "ANALYZING_COMMERCIAL",
      label: "COMMERCIAL_ML: Box Office & Market Viability Prediction",
      description: "Running historical cast, director track record, and budget metrics across gradient-boosted commercial models.",
      icon: <BarChart3 className="w-5 h-5 text-prime-400" />,
    },
    {
      stateCode: "GENERATING_REPORT",
      label: "LLM_SYNTHESIS: Groq Multimodal Report & Studio PDF",
      description: "Fusing visual metrics and market predictions into studio-grade intelligence and PDF manifest.",
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    },
    {
      stateCode: "INDEXING_RAG",
      label: "RAG_INDEXED: FAISS Vector Knowledge Base Ingestion",
      description: "Generating dense sentence embeddings and indexing section chunks for interactive studio Q&A.",
      icon: <Database className="w-5 h-5 text-blue-400" />,
    },
  ];

  const getStepStatus = (stepIndex: number) => {
    if (isCompleted || activeStateCode === "COMPLETED") return "completed";
    if (activeStateCode === "FAILED") return "failed";

    const stateOrder: ProcessingStateCode[] = [
      "VALIDATING_MEDIA",
      "ANALYZING_VIDEO",
      "ANALYZING_COMMERCIAL",
      "GENERATING_REPORT",
      "INDEXING_RAG",
      "COMPLETED",
    ];

    const currentIdx = stateOrder.indexOf(activeStateCode);
    if (currentIdx === -1) {
      return stepIndex === 0 ? "active" : "queued";
    }
    if (currentIdx > stepIndex) return "completed";
    if (currentIdx === stepIndex) return "active";
    return "queued";
  };

  useEffect(() => {
    let isSubscribed = true;

    async function pollStatus() {
      try {
        const statusRes = await reportApi.getFilmStatus(movie.id);

        if (!isSubscribed) return;

        if (statusRes.status) {
          const state = statusRes.processingStatus;
          setActiveStateCode(state);
          setCurrentProgress(statusRes.analysisProgress || 10);
          if (statusRes.timings) setTimings(statusRes.timings);

          if (state === "COMPLETED") {
            // Pipeline finished on backend: fetch the real generated report
            try {
              const fullReport = await reportApi.getFilmReport(movie.id);
              if (typeof window !== "undefined") {
                sessionStorage.setItem(`filmy_report_${movie.id}`, JSON.stringify(fullReport));
              }
            } catch (repErr) {
              console.warn("Could not preload report into sessionStorage:", repErr);
            }

            setIsCompleted(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            return;
          }

          if (state === "FAILED") {
            setPipelineError(statusRes.error || "Analysis pipeline encountered an unexpected error.");
            if (pollingRef.current) clearInterval(pollingRef.current);
            return;
          }
        }
      } catch (err: unknown) {
        console.warn("Status polling error (will retry):", err);
      }
    }

    // Initial check immediately
    pollStatus();

    // Poll every 1.8 seconds
    pollingRef.current = setInterval(pollStatus, 1800);

    return () => {
      isSubscribed = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [movie.id]);

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-8 my-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-prime-500/15 text-prime-400 border border-prime-500/30 mb-1">
          {isCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in-75" />
          ) : pipelineError ? (
            <AlertTriangle className="w-8 h-8 text-red-400 animate-in zoom-in-75" />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-prime-400" />
          )}
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinematic-900 border border-cinematic-700 text-[11px] font-mono uppercase tracking-wider text-prime-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isCompleted
                  ? "bg-emerald-400"
                  : pipelineError
                  ? "bg-red-400"
                  : "bg-prime-400 animate-pulse"
              }`}
            />
            <span>Live Status: {activeStateCode}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            {isCompleted
              ? "AI Intelligence Synthesis Complete"
              : pipelineError
              ? "Analysis Pipeline Error"
              : `Analyzing '${movie.title}'`}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {isCompleted
              ? "Multimodal cinematography analysis, commercial prediction, and RAG knowledge index are ready."
              : pipelineError
              ? "The multimodal engine encountered an error while processing the film."
              : "Executing real-time video resolution, deep ML_VIDEO feature extraction, and Groq synthesis on backend..."}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {!pipelineError && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Pipeline Progress</span>
            <span className="text-netflix-400 font-semibold">{isCompleted ? 100 : currentProgress}%</span>
          </div>
          <div className="w-full h-2 bg-cinematic-950 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-netflix-500 to-netflix-400 transition-all duration-500 rounded-full"
              style={{ width: `${isCompleted ? 100 : currentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ingestion Source Info */}
      <div className="p-3 rounded-xl bg-cinematic-950/60 border border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ingestion Source:</span>
          <span className="font-mono text-netflix-400 font-semibold">
            {isUrlSource ? "Public / Authorized Video URL" : "Local Video Upload"}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
          Real Backend Orchestration
        </span>
      </div>

      {/* Error Alert Box */}
      {pipelineError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Pipeline Failed</p>
              <p className="text-slate-300 mt-1">{pipelineError}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Retry Analysis</span>
          </Button>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const status = getStepStatus(idx);
          const isDone = status === "completed";
          const isActive = status === "active";

          return (
            <div
              key={step.stateCode}
              className={`p-4 rounded-xl transition-all duration-300 flex items-start gap-4 border ${
                isActive
                  ? "bg-cinematic-850 border-netflix-500/40 shadow-lg shadow-netflix-500/10 scale-[1.01]"
                  : isDone
                  ? "bg-cinematic-900/80 border-emerald-500/20"
                  : "bg-cinematic-950/40 border-white/5 opacity-40"
              }`}
            >
              <div className="p-2 rounded-lg bg-cinematic-950 border border-white/10 flex-shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-netflix-400 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-semibold ${
                      isActive ? "text-netflix-400" : isDone ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <span
                    className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : isActive
                        ? "bg-prime-500/15 text-prime-400 border border-prime-500/30 animate-pulse"
                        : "text-slate-500"
                    }`}
                  >
                    {isDone ? "Verified" : isActive ? "Active" : "Queued"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Benchmark Timings */}
      {isCompleted && timings && Object.keys(timings).length > 0 && (
        <div className="p-4 rounded-2xl bg-cinematic-950/80 border border-cinematic-700 space-y-2 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-prime-400 font-semibold">
            Actual Measured Benchmarks
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
            {timings.video_analysis_sec !== undefined && (
              <div className="p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 block text-[10px]">Video ML</span>
                <span>{timings.video_analysis_sec}s</span>
              </div>
            )}
            {timings.commercial_ml_sec !== undefined && (
              <div className="p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 block text-[10px]">Commercial ML</span>
                <span>{timings.commercial_ml_sec}s</span>
              </div>
            )}
            {timings.report_generation_sec !== undefined && (
              <div className="p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 block text-[10px]">Groq Report</span>
                <span>{timings.report_generation_sec}s</span>
              </div>
            )}
            {timings.rag_indexing_sec !== undefined && (
              <div className="p-2 rounded-lg bg-white/5">
                <span className="text-slate-400 block text-[10px]">FAISS RAG</span>
                <span>{timings.rag_indexing_sec}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion CTA */}
      {isCompleted && (
        <div className="pt-4 border-t border-white/10 text-center animate-in fade-in duration-300">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(`/film-report/${movie.id}`)}
            className="w-full py-4 text-base font-semibold shadow-xl shadow-gold-500/25"
          >
            <span>Open Studio Intelligence Report & RAG Q&A</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
