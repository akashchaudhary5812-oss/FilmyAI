"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, X, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { FinalFilmIntelligenceReport } from "@/types/report";
import { chatbotApi } from "@/lib/api/chatbot";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputBox } from "./ChatInputBox";

interface RagChatbotProps {
  report: FinalFilmIntelligenceReport;
}

export function RagChatbot({ report }: RagChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      role: "assistant",
      content: `Hello! I am your Film Intelligence Assistant. I have thoroughly ingested the multimodal data, ML commercial scores, and screenplay metrics for '${report.film_title}'. How can I assist your production review today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // For mobile collapse
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "What are the strongest parts of this film?",
    "Why did the model classify this commercial tier?",
    "What could improve this script?",
    "How does the cinematography support the narrative?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        filmTitle: report.film_title,
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
    <div className="rounded-3xl glass-panel-neural border border-neural-500/30 shadow-2xl flex flex-col h-[650px] overflow-hidden sticky top-24">
      {/* Header */}
      <div className="p-4 bg-cinematic-950/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neural-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-display">
              FILMY AI Intelligence Assistant
            </h3>
            <p className="text-[10px] text-neural-400 font-mono">
              Grounded in &apos;{report.film_title}&apos; Dossier
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 no-scrollbar">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-neural-400 font-mono p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing film intelligence response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Pills */}
          <div className="p-2.5 bg-cinematic-950/60 border-t border-white/5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap text-[10px] bg-cinematic-900/80 hover:bg-neural-500/20 text-slate-300 hover:text-neural-300 py-1 px-2.5 rounded-full border border-white/5 hover:border-neural-500/30 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-cinematic-950/90 border-t border-white/10">
            <ChatInputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
