import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Skeleton */}
      <Skeleton className="w-full h-[60vh] rounded-3xl" />

      {/* Carousel Skeletons */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          <Skeleton className="w-48 sm:w-64 h-80 rounded-xl flex-shrink-0" />
          <Skeleton className="w-48 sm:w-64 h-80 rounded-xl flex-shrink-0" />
          <Skeleton className="w-48 sm:w-64 h-80 rounded-xl flex-shrink-0" />
          <Skeleton className="w-48 sm:w-64 h-80 rounded-xl flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
