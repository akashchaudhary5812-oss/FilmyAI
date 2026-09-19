"use client";

import React, { useState } from "react";
import { Send, Sparkles, CornerDownLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface ChatInputBoxProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export function ChatInputBox({ onSendMessage, isLoading }: ChatInputBoxProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative flex items-center bg-cinematic-950/90 rounded-2xl border border-white/15 focus-within:border-prime-400 focus-within:ring-2 focus-within:ring-prime-500/20 shadow-inner transition-all p-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the screenplay, pacing, commercial viability, or cast..."
          disabled={isLoading}
          className="flex-grow bg-transparent py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-md shadow-netflix-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-prime-400" />
          <span>Multimodal vector retrieval + LLM synthesis</span>
        </span>
        <span className="hidden sm:inline text-slate-400">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-slate-300">Enter ↵</kbd> to submit
        </span>
      </div>
    </form>
  );
}
