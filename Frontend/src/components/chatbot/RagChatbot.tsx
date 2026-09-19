"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  TrendingUp,
  Film,
  Users,
  Layers,
  Lightbulb,
} from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { chatbotApi } from "@/lib/api/chatbot";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputBox } from "./ChatInputBox";

interface RagChatbotProps {
  report: FinalFilmIntelligenceReport;
}

export function RagChatbot({ report }: RagChatbotProps) {
  const initialWelcome: ChatMessage = {
    id: "init_1",
    role: "assistant",
    content: `Hello! I am your Film Intelligence Assistant. I have ingested the multimodal telemetry, ML commercial models, and screenplay metrics for '${report.film_title}'. How can I assist your executive review today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);
  const [conversationId, setConversationId] = useState(
    () => `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { text: "What are the strongest cinematic sequences?", icon: Zap },
    { text: "Why did the model classify this commercial tier?", icon: TrendingUp },
    { text: "How does the cinematography reinforce narrative pacing?", icon: Film },
    { text: "Which actors delivered standout performances?", icon: Users },
    { text: "What are the top 3 editorial fixes recommended?", icon: Lightbulb },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleResetChat = () => {
    setMessages([
      {
        id: `init_${Date.now()}`,
        role: "assistant",
        content: `Conversation reset. Film intelligence for '${report.film_title}' is ready. Ask me any strategic or creative questions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await chatbotApi.askQuestion({
        film_id:
          report.film_id ||
          report.report_id ||
          report.film_title?.replace(/[^a-zA-Z0-9_-]/g, "_"),
        filmTitle: report.film_title,
        conversation_id: conversationId,
        reportContext: report as unknown as Record<string, unknown>,
        query: text,
        history: messages,
      });

      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content:
          "I encountered a temporary connection issue reaching the AI engine. Please verify that your report service is running or retry your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl glass-panel border border-prime-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(0,168,225,0.15)] flex flex-col h-[calc(100vh-5rem)] min-h-[850px] max-h-[1100px] overflow-hidden sticky top-20 backdrop-blur-2xl transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-cinematic-950/95 via-prime-950/30 to-cinematic-950/95 border-b border-prime-500/20 flex items-center justify-between relative z-10 shrink-0 shadow-sm">
        {/* Ambient glow behind header */}
        <div className="absolute inset-0 bg-gradient-to-r from-prime-600/5 via-indigo-600/8 to-prime-600/5 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-prime-700 via-indigo-600 to-prime-500 flex items-center justify-center text-white shadow-lg ring-2 ring-prime-400/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro', sans-serif" }}>
                FILMY AI Intelligence Assistant
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-prime-500/20 text-prime-300 border border-prime-500/30 uppercase tracking-wide">Live</span>
            </div>
            <p className="text-xs text-prime-400 font-mono mt-0.5 truncate max-w-[260px] sm:max-w-sm">
              Grounded in &lsquo;{report.film_title}&rsquo; Dossier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={handleResetChat}
            title="Reset Conversation"
            className="p-2 rounded-xl bg-cinematic-900/80 border border-white/10 hover:border-prime-500/40 hover:bg-prime-950/30 text-slate-400 hover:text-prime-300 transition-all text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">Reset</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-2 rounded-xl bg-cinematic-900/80 border border-white/10 text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Messages Scroll Area */}
          <div className="flex-grow p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-cinematic-900/80 border border-prime-500/30 text-xs text-prime-300 font-mono w-fit shadow-md">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-prime-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-prime-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-prime-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Querying film embeddings & multimodal indexes...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="p-3 bg-cinematic-950/70 border-t border-white/10 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-prime-400" />
              <span>Suggested:</span>
            </span>

            {suggestedPrompts.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSendMessage(item.text)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs font-mono bg-cinematic-900/90 hover:bg-prime-500/20 text-slate-200 hover:text-prime-300 py-1.5 px-3 rounded-xl border border-white/10 hover:border-prime-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-prime-400" />
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>

          {/* Input Box */}
          <div className="p-3.5 sm:p-4 bg-cinematic-950/95 border-t border-white/10 shrink-0">
            <ChatInputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
