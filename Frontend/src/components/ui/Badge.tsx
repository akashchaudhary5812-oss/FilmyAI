"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "neural" | "netflix" | "prime" | "dark" | "outline" | "success" | "danger";
}

export function Badge({
  className,
  variant = "dark",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    gold: "bg-netflix-500/15 text-netflix-400 border-netflix-500/30",
    netflix: "bg-netflix-500/15 text-netflix-400 border-netflix-500/30",
    neural: "bg-prime-500/15 text-prime-400 border-prime-500/30",
    prime: "bg-prime-500/15 text-prime-400 border-prime-500/30",
    dark: "bg-cinematic-900 text-slate-200 border-cinematic-700",
    outline: "bg-transparent text-slate-300 border-cinematic-700",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase font-display",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
