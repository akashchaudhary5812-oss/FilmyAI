"use client";

import React from "react";
import { Film, AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No Films Found",
  description = "There are currently no movies matching your criteria.",
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-panel my-8 max-w-lg mx-auto">
      <div className="p-4 rounded-full bg-cinematic-800 text-gold-400 mb-4 border border-white/10">
        {icon || <Film className="w-8 h-8 opacity-80" />}
      </div>
      <h3 className="text-xl font-semibold text-slate-100 font-display mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Intelligence Pipeline Error",
  message = "An error occurred while fetching film data from the backend.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-red-950/20 border border-red-500/20 my-8 max-w-lg mx-auto">
      <div className="p-3 rounded-full bg-red-900/40 text-red-400 mb-4 border border-red-500/30">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-red-200 font-display mb-2">{title}</h3>
      <p className="text-sm text-red-300/80 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Retry Request
        </Button>
      )}
    </div>
  );
}
