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
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#07080b] text-slate-100 antialiased selection:bg-gold-500 selection:text-cinematic-950">
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow pt-20">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
