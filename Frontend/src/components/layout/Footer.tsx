import React from "react";
import Link from "next/link";
import { Clapperboard, Sparkles, Shield, Cpu, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-cinematic-950 border-t border-white/10 mt-24 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gold-600 to-amber-300 flex items-center justify-center">
                <Clapperboard className="w-4 h-4 text-cinematic-950" />
              </div>
              <span className="text-lg font-black tracking-wider text-white font-display">
                FILMY<span className="text-gold-400 ml-1">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Studio-grade film intelligence platform unifying multimodal video analysis, predictive commercial modeling, and LLM script synthesis.
            </p>
            <div className="flex items-center gap-2 text-xs text-gold-500/80 font-mono pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Engine: Multimodal Studio v1.0</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono mb-4">
              Explore Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-gold-400 transition-colors">
                  Trending Releases
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-gold-400 transition-colors">
                  Film Catalog & Archive
                </Link>
              </li>
              <li>
                <Link href="/analyze" className="hover:text-gold-400 transition-colors">
                  Upload & Analyze Film
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-gold-400 transition-colors">
                  Multi-Parametric Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono mb-4">
              Intelligence Stack
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-neural-400" />
                <span>PyTorch Video Cinematography</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-gold-400" />
                <span>ML Commercial Predictor</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Groq LLM Studio Synthesizer</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>ImageKit Media Ingestion</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase font-mono mb-4">
              Studio Governance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Configured dynamically via environment variables with zero hardcoded endpoints or client-exposed secrets.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cinematic-900 border border-white/10 text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API Base: Configurable
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} FILMY AI. Studio Intelligence Architecture. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Charter</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Studio Terms</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Security Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
