"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Space / K", description: "Play / Pause video" },
  { key: "F", description: "Toggle Fullscreen" },
  { key: "M", description: "Mute / Unmute audio" },
  { key: "← / J", description: "Rewind 10 seconds" },
  { key: "→ / L", description: "Forward 10 seconds" },
  { key: "↑ / ↓", description: "Volume Up / Down (10%)" },
  { key: "C", description: "Toggle Subtitles / Closed Captions" },
  { key: "X", description: "Toggle Prime Video X-Ray panel" },
  { key: "?", description: "Show this shortcuts guide" },
  { key: "Esc", description: "Exit Fullscreen or Close modal" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-cinematic-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Streamline your cinema viewing experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-cinematic-950/60 border border-white/5 text-xs"
            >
              <span className="text-slate-300">{item.description}</span>
              <kbd className="px-2 py-1 rounded bg-cinematic-800 text-gold-400 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gold-500 text-cinematic-950 font-bold text-xs hover:bg-gold-400 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
