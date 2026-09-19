"use client";

import React, { useState } from "react";
import { Sparkles, User, Copy, Check, ShieldCheck, FileText } from "lucide-react";
import { ChatMessage } from "@/types/chat";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3.5 text-xs leading-relaxed group transition-all ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-prime-600 via-indigo-600 to-prime-400 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md ring-1 ring-prime-400/40">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[88%] p-4 rounded-2xl relative shadow-md transition-all ${
          isAssistant
            ? "bg-cinematic-900/90 border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-md hover:border-prime-500/30"
            : "bg-gradient-to-r from-netflix-600 to-netflix-500 text-white font-medium rounded-tr-sm shadow-netflix-500/20"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed text-[13px] font-sans selection:bg-prime-500 selection:text-white">
          {message.content}
        </p>

        {/* Source Citations Badges */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
            <span className="text-[10px] font-mono text-prime-400 font-bold flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>Grounded Evidence Citations:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10px] font-mono bg-cinematic-950/80 border border-white/10 text-slate-300 px-2 py-0.5 rounded-lg hover:border-prime-500/40 transition-colors"
                  title={src.excerpt || `${src.section} > ${src.subsection || ""}`}
                >
                  <FileText className="w-2.5 h-2.5 text-prime-400" />
                  <span className="font-semibold text-slate-200">
                    {src.section}
                    {src.subsection ? ` › ${src.subsection}` : ""}
                  </span>
                  {src.relevance_score && (
                    <span className="text-[9px] text-emerald-400 font-bold ml-0.5">
                      {Math.round(src.relevance_score * 100)}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer timestamp & copy button */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
          <span
            className={`text-[10px] font-mono ${
              isAssistant ? "text-slate-400" : "text-white/80"
            }`}
          >
            {message.timestamp}
          </span>

          {isAssistant && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] flex items-center gap-1"
              title="Copy message text"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-cinematic-850 border border-white/15 flex items-center justify-center text-slate-200 shrink-0 mt-0.5 shadow-sm">
          <User className="w-4 h-4 text-netflix-400" />
        </div>
      )}
    </div>
  );
}
