"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileVideo, X, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

interface DropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  progress?: number;
  isUploading?: boolean;
}

export function Dropzone({
  selectedFile,
  onFileSelect,
  progress = 0,
  isUploading = false,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? "border-gold-500 bg-gold-500/10 shadow-xl shadow-gold-500/10"
              : "border-white/15 bg-cinematic-900/50 hover:border-gold-500/40 hover:bg-cinematic-900"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-cinematic-800 text-gold-400 mx-auto flex items-center justify-center mb-4 border border-white/10">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white font-display">
            Drop Film Reel or Artwork Here
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports MP4, MOV, WEBM videos or high-resolution keyframe posters (up to 500MB)
          </p>
          <Button type="button" variant="secondary" size="sm">
            Browse Studio Files
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl glass-panel border border-white/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-500/15 text-gold-400 flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || "Video/Media"}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-gold-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Streaming to ImageKit Storage...
                </span>
                <span className="font-mono text-white font-semibold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-cinematic-950 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
