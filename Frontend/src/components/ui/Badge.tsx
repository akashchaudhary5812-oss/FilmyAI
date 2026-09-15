import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "neural" | "dark" | "outline" | "success" | "danger";
}

export function Badge({
  className,
  variant = "dark",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    gold: "bg-gold-500/15 text-gold-400 border-gold-500/30",
    neural: "bg-neural-500/15 text-neural-400 border-neural-500/30",
    dark: "bg-cinematic-800 text-slate-300 border-white/10",
    outline: "bg-transparent text-slate-300 border-white/20",
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
