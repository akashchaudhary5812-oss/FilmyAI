import React from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-cinematic-800 text-netflix-400 flex items-center justify-center mb-6 border border-white/10">
        <Clapperboard className="w-8 h-8" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black text-white font-display tracking-tight mb-3">
        404 — Reel Not Found
      </h1>
      <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
        The cinematic feature or intelligence dossier you requested does not exist in the studio archives.
      </p>
      <Link href="/">
        <Button variant="primary" size="lg">
          Return to Studio Home
        </Button>
      </Link>
    </div>
  );
}
