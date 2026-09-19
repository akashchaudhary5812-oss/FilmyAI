"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Lock, Mail, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/Button";

export function SignupForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      await register({ username, email, password });
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Try a different email.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl glass-panel shadow-2xl border border-cinematic-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-red-700 via-netflix-500 to-prime-500 mb-3 shadow-lg shadow-netflix-500/25">
          <Clapperboard className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white font-display">Create Studio Account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Join the premier film intelligence and AI predictive platform
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Filmmaker / Studio Username
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="christopher_nolan"
              required
              className="w-full bg-cinematic-950/80 border border-cinematic-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 focus:ring-1 focus:ring-prime-500/30 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="director@syncopy.com"
              required
              className="w-full bg-cinematic-950/80 border border-cinematic-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 focus:ring-1 focus:ring-prime-500/30 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-cinematic-950/80 border border-cinematic-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-prime-500 focus:ring-1 focus:ring-prime-500/30 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 mt-2 text-sm font-semibold"
          isLoading={isLoading}
        >
          Create Studio Account
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
        Already have a studio account?{" "}
        <Link href="/login" className="text-netflix-400 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
