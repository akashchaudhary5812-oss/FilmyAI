import React from "react";
import { Sparkles, User } from "lucide-react";
import { ChatMessage } from "@/types/chat";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex items-start gap-3 text-xs leading-relaxed ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-cinematic-950 flex-shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`max-w-[85%] p-3.5 rounded-2xl ${
          isAssistant
            ? "bg-cinematic-900 border border-white/10 text-slate-200 rounded-tl-sm"
            : "bg-gradient-to-r from-gold-500 to-amber-500 text-cinematic-950 font-medium rounded-tr-sm shadow-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span
          className={`block text-[9px] mt-1.5 font-mono ${
            isAssistant ? "text-slate-500" : "text-cinematic-900/80"
          }`}
        >
          {message.timestamp}
        </span>
      </div>

      {!isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-cinematic-800 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
