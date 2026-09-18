"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "../../page";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AuthenticatedHome({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!isLoading && (!user || user.id !== userId)) router.replace(user ? `/${user.id}/home` : "/login"); }, [isLoading, user, userId, router]);
  if (isLoading || !user || user.id !== userId) return <div className="max-w-7xl mx-auto px-4 py-20"><Skeleton className="h-72 rounded-3xl" /></div>;
  return <HomePage />;
}
