import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FILMY AI — Film Intelligence & Discovery Platform",
  description:
    "Next-generation cinema intelligence platform unifying multimodal video analysis, commercial predictive modeling, and studio-grade AI film reports.",
  keywords: ["Film Intelligence", "AI Cinema", "Movie Discovery", "Film Analysis", "Screenplay AI", "Cinematography AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-cinematic-950 text-slate-100 antialiased selection:bg-netflix-500 selection:text-white relative">
        {/* Subtle Ambient Cinematic Glow Overlays (Netflix Red + Prime Blue) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-netflix-500/[0.04] blur-[130px]" />
          <div className="absolute top-10 -right-40 w-[700px] h-[700px] rounded-full bg-prime-500/[0.045] blur-[150px]" />
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-prime-600/[0.02] blur-[160px]" />
        </div>

        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow pt-20 relative z-10">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
