"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "neural" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cinematic-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none rounded-lg cursor-pointer";

    const variants = {
      primary:
        "bg-netflix-500 hover:bg-netflix-400 text-white font-semibold shadow-lg shadow-netflix-500/25 hover:shadow-netflix-500/40 transition-all",
      secondary:
        "bg-cinematic-900 text-slate-100 hover:bg-cinematic-850 border border-cinematic-700 hover:border-prime-500/40 hover:text-white shadow-sm transition-all",
      neural:
        "bg-prime-500 hover:bg-prime-400 text-white font-semibold shadow-lg shadow-prime-500/25 hover:shadow-prime-500/40 transition-all",
      outline:
        "border border-cinematic-700 text-slate-200 hover:bg-cinematic-900 hover:border-white/40 hover:text-white transition-all",
      ghost: "text-slate-300 hover:bg-cinematic-900/80 hover:text-white transition-colors",
      danger: "bg-red-700/80 text-white hover:bg-red-600 border border-red-500/30 transition-colors",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
