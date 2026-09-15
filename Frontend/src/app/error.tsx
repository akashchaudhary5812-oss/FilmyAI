"use client";

import React from "react";
import { ErrorState } from "@/components/ui/EmptyState";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <ErrorState
        title="Application Error"
        message={error.message || "An unexpected error occurred while loading this page."}
        onRetry={reset}
      />
    </div>
  );
}
