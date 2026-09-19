"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Sparkles,
  ArrowLeft,
  Settings,
  Subtitles,
  HelpCircle,
  Tv,
  Film,
  Check,
  ChevronRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Movie } from "@/types/movie";
import { XRayDrawer } from "./XRayDrawer";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { useWatchProgress } from "@/hooks/useWatchProgress";

interface CinemaPlayerProps {
  movie: Movie;
  allMovies?: Movie[];
}

// Fallback authentic open-source cinematic MP4 streams if original upload is an image or inaccessible
const DEMO_STREAMS = [
  {
    label: "Tears of Steel (Sci-Fi 4K)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
  {
    label: "Big Buck Bunny (Animation)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    label: "Sintel (Action/Drama)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
];

// Subtitle samples for demonstration of CC support
const SAMPLE_SUBTITLES: Record<string, { start: number; end: number; text: string }[]> = {
  en: [
    { start: 0, end: 5, text: "[Dramatic orchestral music plays]" },
    { start: 5, end: 11, text: "In the cinematic future, intelligence defines the story." },
    { start: 12, end: 18, text: "Director: Stand by for scene transition..." },
    { start: 19, end: 27, text: "Filmy AI: Multimodal neural analysis in progress." },
    { start: 28, end: 38, text: "[Sound of cinematic tension building]" },
    { start: 39, end: 50, text: "Every frame tells a story of creative vision." },
  ],
  hi: [
    { start: 0, end: 5, text: "[रोमांचक सिनेमाई संगीत बजता है]" },
    { start: 5, end: 11, text: "सिनेमा के भविष्य में, बुद्धिमत्ता कहानी तय करती है।" },
    { start: 12, end: 18, text: "निर्देशक: अगले दृश्य के लिए तैयार रहें..." },
    { start: 19, end: 27, text: "फ़िल्मी एआई: वास्तविक समय विश्लेषण जारी है।" },
    { start: 28, end: 38, text: "[सिनेमाई रोमांच बढ़ता है]" },
  ],
  es: [
    { start: 0, end: 5, text: "[Música orquestal dramática suena]" },
    { start: 5, end: 11, text: "En el futuro del cine, la inteligencia define la historia." },
    { start: 12, end: 18, text: "Director: Prepárense para la transición de escena..." },
    { start: 19, end: 27, text: "Filmy AI: Análisis neuronal multimodal en progreso." },
  ],
};

export function CinemaPlayer({ movie, allMovies = [] }: CinemaPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch progress hook
  const { currentProgress, saveProgress } = useWatchProgress(movie.id);

  // Determine initial video source
  const isDirectVideo =
    typeof movie.videoUrl === "string" &&
    (/\.(mp4|webm|mov|mkv|m4v)$/i.test(movie.videoUrl.split("?")[0]) ||
      movie.videoUrl.includes("/uploads/videos/"));

  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(() => {
    if (isDirectVideo && movie.videoUrl) return movie.videoUrl;
    // Default to Tears of Steel cinematic sample if image or no video
    return DEMO_STREAMS[0].url;
  });

  const isDemoFallback = activeStreamUrl !== movie.videoUrl;

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Modals & Panels
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isStreamSelectorOpen, setIsStreamSelectorOpen] = useState(false);

  // Subtitles & Audio tracks
  const [selectedSubtitle, setSelectedSubtitle] = useState<"off" | "en" | "hi" | "es">("en");
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("English [Original]");

  // Ripple feedback animations
  const [centerRipple, setCenterRipple] = useState<"play" | "pause" | null>(null);
  const [skipRipple, setSkipRipple] = useState<"rewind" | "forward" | null>(null);

  // Hover scrubber state
  const [hoverPosition, setHoverPosition] = useState<{ percent: number; time: number; x: number } | null>(null);

  // Resume prompt
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumedTime, setResumedTime] = useState<number | null>(null);

  // End of video Up Next card
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextSeconds, setUpNextSeconds] = useState(10);

  // Next recommended movie
  const nextMovie = allMovies.find((m) => m.id !== movie.id) || allMovies[0];

  // Check for resume position on mount
  useEffect(() => {
    if (currentProgress && currentProgress.progressSeconds > 10 && currentProgress.progressPercent < 90) {
      setResumedTime(currentProgress.progressSeconds);
      setShowResumeBanner(true);
    }
  }, [currentProgress]);

  // Wake up HUD and set auto-hide timer
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isXRayOpen && !isSpeedMenuOpen && !isAudioMenuOpen && !isStreamSelectorOpen && !isShortcutsOpen) {
          setShowControls(false);
        }
      }, 2500);
    }
  }, [isPlaying, isXRayOpen, isSpeedMenuOpen, isAudioMenuOpen, isStreamSelectorOpen, isShortcutsOpen]);

  // Trigger ripple animation briefly
  const triggerCenterRipple = (type: "play" | "pause") => {
    setCenterRipple(type);
    setTimeout(() => setCenterRipple(null), 600);
  };

  const triggerSkipRipple = (type: "rewind" | "forward") => {
    setSkipRipple(type);
    setTimeout(() => setSkipRipple(null), 500);
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      triggerCenterRipple("play");
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerCenterRipple("pause");
      setShowControls(true);
    }
  }, []);

  // Skip time
  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoRef.current.duration || 0));
    triggerSkipRipple(seconds < 0 ? "rewind" : "forward");
    handleUserActivity();
  }, [handleUserActivity]);

  // Volume toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
    handleUserActivity();
  }, [isMuted, handleUserActivity]);

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
    handleUserActivity();
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
    handleUserActivity();
  }, [handleUserActivity]);

  // Change playback speed
  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSpeedMenuOpen(false);
    handleUserActivity();
  };

  // Scrubber drag / click
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition({
      percent,
      time: percent * duration,
      x: e.clientX - rect.left,
    });
  };

  // Resume handler
  const handleResume = () => {
    if (videoRef.current && resumedTime) {
      videoRef.current.currentTime = resumedTime;
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
    setShowResumeBanner(false);
  };

  const handleStartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
    setShowResumeBanner(false);
  };

  // Picture in picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported or failed", err);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case "c":
          e.preventDefault();
          setSelectedSubtitle((prev) => (prev === "off" ? "en" : prev === "en" ? "hi" : "off"));
          break;
        case "x":
          e.preventDefault();
          setIsXRayOpen((prev) => !prev);
          break;
        case "?":
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          break;
        case "escape":
          setIsXRayOpen(false);
          setIsShortcutsOpen(false);
          setIsSpeedMenuOpen(false);
          setIsAudioMenuOpen(false);
          setIsStreamSelectorOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, volume]);

  // Video timeupdate handler: track progress, subtitles, buffering
  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Save watch progress periodically (every 3 seconds)
    if (Math.floor(current) % 3 === 0 && duration > 0) {
      saveProgress(movie, current, duration);
    }

    // Update Subtitles
    if (selectedSubtitle !== "off") {
      const subs = SAMPLE_SUBTITLES[selectedSubtitle] || [];
      const activeSub = subs.find((s) => current >= s.start && current <= s.end);
      setCurrentSubtitleText(activeSub ? activeSub.text : "");
    } else {
      setCurrentSubtitleText("");
    }

    // Up Next countdown near end
    if (duration > 30 && duration - current <= 15 && !showUpNext && nextMovie) {
      setShowUpNext(true);
    }
  };

  const onProgress = () => {
    if (!videoRef.current || !duration) return;
    const buf = videoRef.current.buffered;
    if (buf.length > 0) {
      const bufferedEnd = buf.end(buf.length - 1);
      setBufferedPercent(Math.min(100, (bufferedEnd / duration) * 100));
    }
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (nextMovie) {
      setShowUpNext(true);
    }
  };

  // Up next countdown
  useEffect(() => {
    if (!showUpNext) return;
    const timer = setInterval(() => {
      setUpNextSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (nextMovie) router.push(`/watch/${nextMovie.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showUpNext, nextMovie, router]);

  // Formatting helpers
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = Math.floor(secs % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className={`relative w-full h-screen bg-black overflow-hidden select-none font-sans ${
        !showControls && isPlaying ? "cursor-none" : "cursor-default"
      }`}
    >
      {/* Native HTML5 Video Element */}
      <video
        ref={videoRef}
        src={activeStreamUrl}
        poster={movie.backdropUrl || movie.posterUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={onTimeUpdate}
        onProgress={onProgress}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onClick={togglePlay}
        playsInline
      />

      {/* Subtitles Overlay (Netflix Yellow / White drop shadow font) */}
      {currentSubtitleText && (
        <div
          className={`absolute bottom-24 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none transition-all duration-300 ${
            showControls ? "translate-y-[-24px]" : "translate-y-0"
          }`}
        >
          <div className="bg-black/75 px-4 py-2 rounded-lg max-w-2xl text-center shadow-lg backdrop-blur-sm">
            <span
              className="text-amber-300 font-display font-semibold text-lg sm:text-2xl tracking-wide"
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)",
              }}
            >
              {currentSubtitleText}
            </span>
          </div>
        </div>
      )}

      {/* Center Animated Feedback Ripple */}
      {centerRipple && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl animate-pingOnce">
            {centerRipple === "play" ? (
              <Play className="w-10 h-10 fill-white ml-1.5" />
            ) : (
              <Pause className="w-10 h-10 fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Skip Seek Indicators (-10s / +10s) */}
      {skipRipple === "rewind" && (
        <div className="absolute top-1/2 left-12 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center text-white border border-white/20">
            <RotateCcw className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs font-bold font-mono text-white mt-2">-10 sec</span>
        </div>
      )}

      {skipRipple === "forward" && (
        <div className="absolute top-1/2 right-12 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center text-white border border-white/20">
            <RotateCw className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs font-bold font-mono text-white mt-2">+10 sec</span>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10">
            <div className="w-10 h-10 border-4 border-netflix-500/30 border-t-netflix-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-200 tracking-wider uppercase">
              Buffering Cinema Stream...
            </span>
          </div>
        </div>
      )}

      {/* Resume from timestamp banner */}
      {showResumeBanner && resumedTime && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-cinematic-900/95 border border-cinematic-700 backdrop-blur-lg px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs animate-slideDown">
          <span className="text-slate-200">
            Resume watching from{" "}
            <span className="font-bold text-netflix-400 font-mono">
              {formatTime(resumedTime)}
            </span>
            ?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResume}
              className="px-3 py-1.5 rounded-lg bg-netflix-500 text-white font-bold hover:bg-netflix-400 transition-colors cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={handleStartFromBeginning}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Up Next Countdown Overlay (Netflix Style) */}
      {showUpNext && nextMovie && (
        <div className="absolute bottom-28 right-6 z-40 w-80 bg-cinematic-950/95 border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="text-netflix-400 font-bold uppercase tracking-wider font-mono">
              Up Next in {upNextSeconds}s
            </span>
            <button
              onClick={() => setShowUpNext(false)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-cinematic-800 border border-white/10 flex-shrink-0">
              {nextMovie.posterUrl ? (
                <img
                  src={nextMovie.posterUrl}
                  alt={nextMovie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Film className="w-6 h-6 text-netflix-400 m-auto" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white truncate">{nextMovie.title}</h5>
              <p className="text-[11px] text-slate-400 truncate">{nextMovie.genre} • {nextMovie.director}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => router.push(`/watch/${nextMovie.id}`)}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-netflix-500 text-white font-bold text-xs hover:bg-netflix-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play Now</span>
            </button>
            <Link
              href={`/film-report/${movie.id}`}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-prime-400" />
              <span>AI Report</span>
            </Link>
          </div>
        </div>
      )}

      {/* TOP HUD BAR */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex items-center justify-between ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Back & Movie Info */}
        <div className="flex items-center gap-4">
          <Link
            href={`/movies/${movie.id}`}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline text-xs font-semibold pr-1">Back</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-white font-display tracking-tight drop-shadow-md">
                {movie.title}
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-netflix-500/20 text-netflix-400 border border-netflix-500/30">
                {movie.genre}
              </span>
              {isDemoFallback && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Tv className="w-3 h-3" /> Studio 4K Stream
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 line-clamp-1">
              Directed by {movie.director}
              {movie.casting && ` • Starring ${movie.casting}`}
            </p>
          </div>
        </div>

        {/* Right Action Icons: Stream Switcher, Shortcuts, X-Ray */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stream Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStreamSelectorOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer border border-white/10"
              title="Select Video Stream"
            >
              <Film className="w-3.5 h-3.5 text-netflix-400" />
              <span className="hidden md:inline">Source</span>
            </button>

            {isStreamSelectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-cinematic-950/95 border border-white/15 rounded-xl p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10 mb-1">
                  Playback Stream Sources
                </div>
                {movie.videoUrl && isDirectVideo && (
                  <button
                    onClick={() => {
                      setActiveStreamUrl(movie.videoUrl!);
                      setIsStreamSelectorOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeStreamUrl === movie.videoUrl
                        ? "bg-netflix-500/20 text-netflix-400 font-bold"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>Original Upload File</span>
                    {activeStreamUrl === movie.videoUrl && <Check className="w-3.5 h-3.5 text-netflix-400" />}
                  </button>
                )}
                {DEMO_STREAMS.map((demo) => (
                  <button
                    key={demo.url}
                    onClick={() => {
                      setActiveStreamUrl(demo.url);
                      setIsStreamSelectorOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeStreamUrl === demo.url
                        ? "bg-gold-500/20 text-gold-400 font-bold"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{demo.label}</span>
                    {activeStreamUrl === demo.url && <Check className="w-3.5 h-3.5 text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prime Video "X-Ray" Button */}
          <button
            onClick={() => setIsXRayOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer ${
              isXRayOpen
                ? "bg-cyan-500 text-cinematic-950 shadow-lg shadow-cyan-500/30"
                : "bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>X-RAY</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white backdrop-blur-md transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM HUD CONTROLS BAR */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 pt-16 pb-6 px-4 sm:px-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-3">
          {/* TIMELINE SCRUBBER CONTAINER */}
          <div
            ref={progressBarRef}
            onClick={handleScrub}
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={() => setHoverPosition(null)}
            className="relative w-full h-3 flex items-center cursor-pointer group"
          >
            {/* Background Track */}
            <div className="relative w-full h-1 group-hover:h-2 rounded-full bg-white/20 transition-all overflow-hidden">
              {/* Buffered Progress */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all duration-150"
                style={{ width: `${bufferedPercent}%` }}
              />

              {/* Played Progress (Netflix Red Signature) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-700 via-netflix-500 to-netflix-400 rounded-full shadow-lg shadow-netflix-500/40"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Glowing Scrubber Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 group-hover:w-4 group-hover:h-4 rounded-full bg-white shadow-xl shadow-netflix-500/50 scale-0 group-hover:scale-100 transition-transform pointer-events-none border-2 border-netflix-500"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Hover Tooltip Timestamp */}
            {hoverPosition && (
              <div
                className="absolute bottom-full mb-3 -translate-x-1/2 pointer-events-none z-40 bg-cinematic-900/95 border border-white/20 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-white shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5"
                style={{ left: `${hoverPosition.x}px` }}
              >
                <span>{formatTime(hoverPosition.time)}</span>
              </div>
            )}
          </div>

          {/* CONTROLS ACTIONS ROW */}
          <div className="flex items-center justify-between text-white">
            {/* Left Controls: Play, Rewind, Fast Forward, Volume, Time */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              {/* Skip 10s Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-2 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Skip 10s Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Volume Group with Hover Slider */}
              <div className="flex items-center group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Mute / Unmute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-200 flex items-center pr-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-netflix-500 bg-white/30 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Current Time / Duration */}
              <div className="text-xs font-mono text-slate-300 tracking-wider">
                <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                <span className="mx-1.5 text-slate-500">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Subtitles, Speed, PiP, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtitles & Audio Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsAudioMenuOpen((prev) => !prev)}
                  className={`p-2 rounded-full hover:bg-white/15 transition-colors cursor-pointer ${
                    selectedSubtitle !== "off" ? "text-netflix-400" : "text-slate-300 hover:text-white"
                  }`}
                  title="Subtitles & Audio (C)"
                >
                  <Subtitles className="w-5 h-5" />
                </button>

                {isAudioMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-3 w-64 bg-cinematic-950/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50 space-y-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-gold-400 font-bold tracking-wider mb-1.5">
                        Subtitles
                      </div>
                      <div className="space-y-1">
                        {[
                          { id: "off", label: "Off" },
                          { id: "en", label: "English [CC]" },
                          { id: "hi", label: "Hindi (हिन्दी)" },
                          { id: "es", label: "Spanish (Español)" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedSubtitle(item.id as any);
                              setIsAudioMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1 rounded-lg text-xs flex items-center justify-between ${
                              selectedSubtitle === item.id
                                ? "bg-gold-500/20 text-gold-400 font-bold"
                                : "text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <span>{item.label}</span>
                            {selectedSubtitle === item.id && <Check className="w-3.5 h-3.5 text-gold-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-2">
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider mb-1.5">
                        Audio Track
                      </div>
                      <div className="space-y-1">
                        {["English [Original]", "Hindi (Stereo)", "AI Director Commentary"].map((track) => (
                          <button
                            key={track}
                            onClick={() => {
                              setSelectedAudio(track);
                              setIsAudioMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1 rounded-lg text-xs flex items-center justify-between ${
                              selectedAudio === track
                                ? "bg-cyan-500/20 text-cyan-400 font-bold"
                                : "text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <span>{track}</span>
                            {selectedAudio === track && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/15 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {isSpeedMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-3 w-32 bg-cinematic-950/95 border border-white/15 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 space-y-0.5">
                    <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10 mb-1">
                      Speed
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`w-full text-left px-2 py-1 rounded-md text-xs flex items-center justify-between ${
                          playbackSpeed === spd
                            ? "bg-gold-500/20 text-gold-400 font-bold"
                            : "text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span>{spd}x</span>
                        {playbackSpeed === spd && <Check className="w-3 h-3 text-gold-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                className="hidden sm:inline-flex p-2 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Picture-in-Picture"
              >
                <Tv className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Amazon Prime Video X-Ray Overlay Drawer */}
      <XRayDrawer
        movie={movie}
        isOpen={isXRayOpen}
        onClose={() => setIsXRayOpen(false)}
        currentTime={currentTime}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
