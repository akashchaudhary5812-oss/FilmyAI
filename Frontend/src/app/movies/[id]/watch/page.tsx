"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MovieWatchRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/watch/${id}`);
    }
  }, [id, router]);

  return (
    <div className="w-full h-screen bg-cinematic-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-netflix-500/30 border-t-netflix-500 rounded-full animate-spin" />
    </div>
  );
}
