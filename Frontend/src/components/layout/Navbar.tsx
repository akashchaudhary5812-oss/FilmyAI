"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Sparkles, Search, User as UserIcon, LogOut, Menu, X, Clapperboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/Button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "My Movies", href: "/my-movies", authRequired: true },
    { name: "AI Analysis", href: "/analyze", highlight: true },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-cinematic-950/90 backdrop-blur-md border-b border-white/10 shadow-2xl py-3"
          : "bg-gradient-to-b from-cinematic-950/90 via-cinematic-950/50 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform duration-300">
            <Clapperboard className="w-5 h-5 text-cinematic-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-wider text-white font-display">
              FILMY<span className="text-gold-400 font-extrabold ml-1">AI</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] text-slate-400 uppercase font-mono -mt-1">
              Studio Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-cinematic-900/60 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
          {navLinks.map((link) => {
            if (link.authRequired && !isAuthenticated) return null;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? link.highlight
                      ? "bg-gold-500 text-cinematic-950 font-semibold shadow-md shadow-gold-500/20"
                      : "bg-white/10 text-white font-semibold"
                    : link.highlight
                    ? "text-gold-400 hover:text-gold-300 hover:bg-gold-500/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.highlight && <Sparkles className="w-3.5 h-3.5" />}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search trigger */}
          <Link
            href="/search"
            className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            title="Search Movies"
          >
            <Search className="w-4 h-4" />
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <Link
                href="/my-movies"
                className="flex items-center gap-2 text-sm text-slate-200 hover:text-gold-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-cinematic-800 border border-gold-500/30 flex items-center justify-center text-gold-400 font-semibold text-xs">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="font-medium">{user?.username}</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Join Studio
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/search"
            className="p-2 text-slate-300 hover:text-white"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-cinematic-950/95 border-b border-white/10 px-6 py-6 space-y-4 backdrop-blur-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              if (link.authRequired && !isAuthenticated) return null;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    pathname === link.href
                      ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {link.highlight && <Sparkles className="w-4 h-4 text-gold-400" />}
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between bg-cinematic-900 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-white">{user?.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    router.push("/");
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Join Studio
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
