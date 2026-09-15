"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about strengths, risks, box office..."
        disabled={isLoading}
        className="flex-grow bg-cinematic-950/90 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
      />
      <Button
        type="submit"
        variant="primary"
        size="icon"
        disabled={!input.trim() || isLoading}
        className="h-9 w-9 flex-shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
      </Button>
    </form>
  );
}
