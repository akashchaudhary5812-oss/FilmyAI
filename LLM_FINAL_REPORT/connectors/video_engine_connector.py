"""
Connector for the existing Multimodal Video Intelligence Engine (ML_VIDEO/).
Interfaces with ML_VIDEO.src.inference.video_analyzer.FilmyAIVideoEngine.
"""
import os
import sys
import tempfile
import requests
from pathlib import Path
from typing import Dict, Any, Optional

from LLM_FINAL_REPORT.config import WORKSPACE_ROOT, ML_VIDEO_DIR, TEMP_DIR
from LLM_FINAL_REPORT.schemas.evidence_schema import VideoCinematographyEvidence

# Ensure workspace root is in sys.path for ML_VIDEO package imports
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))


class VideoEngineConnector:
    """
    Safely connects to and executes multimodal video intelligence analysis using ML_VIDEO.
    """
    def __init__(self):
        self._engine = None
        self._init_error = None

    def _get_engine(self):
        if self._engine is None and self._init_error is None:
            try:
                from ML_VIDEO.src.inference.video_analyzer import FilmyAIVideoEngine
                self._engine = FilmyAIVideoEngine()
            except Exception as e:
                self._init_error = str(e)
                print(f"[VideoEngineConnector] Warning: Failed to initialize FilmyAIVideoEngine: {e}")
        return self._engine

    def _resolve_video_file(self, video_path: Optional[str], video_url: Optional[str]) -> Optional[Path]:
        """
        Resolves local path or downloads remote video URL to a local temporary file.
        """
        # 1. Direct local path
        target = video_path or video_url
        if not target:
            return None

        local_p = Path(target)
        if local_p.exists() and local_p.is_file():
            return local_p

        # Also check relative to workspace root
        ws_p = WORKSPACE_ROOT / target
        if ws_p.exists() and ws_p.is_file():
            return ws_p

        # 2. Remote URL download
        if isinstance(target, str) and (target.startswith("http://") or target.startswith("https://")):
            try:
                print(f"[VideoEngineConnector] Downloading video from URL: {target}")
                TEMP_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(target.split("?")[0]).suffix or ".mp4"
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=TEMP_DIR)
                with requests.get(target, stream=True, timeout=60) as r:
                    r.raise_for_status()
                    for chunk in r.iter_content(chunk_size=8192):
                        temp_file.write(chunk)
                temp_file.close()
                return Path(temp_file.name)
            except Exception as e:
                print(f"[VideoEngineConnector] Error downloading video from URL: {e}")
                return None

        return None

    def analyze(
        self,
        video_path: Optional[str] = None,
        video_url: Optional[str] = None,
        keyframe_dir: Optional[str] = None,
        max_duration_sec: Optional[float] = None
    ) -> VideoCinematographyEvidence:
        """
        Runs ML_VIDEO intelligence analysis on the provided video.
        """
        resolved_video = self._resolve_video_file(video_path, video_url)
        if resolved_video is None or not resolved_video.exists():
            return VideoCinematographyEvidence(
                status="not_available",
                error_message="Valid video file could not be located or downloaded from input."
            )

        engine = self._get_engine()
        if engine is None:
            return VideoCinematographyEvidence(
                status="failed",
                error_message=f"ML_VIDEO Engine initialization error: {self._init_error}"
            )

        try:
            report = engine.analyze_video(
                video_path=str(resolved_video),
                keyframe_dir=keyframe_dir,
                max_duration_sec=max_duration_sec
            )

            meta = report.get("film_metadata", {})
            exec_sum = report.get("executive_summary", {})
            cin_prof = report.get("cinematography_profile", {})
            detailed_shots = report.get("detailed_shots", [])

            # Extract keyframe paths
            keyframes = []
            for s in detailed_shots:
                kf = s.get("keyframe_file")
                if kf and str(kf) not in keyframes:
                    keyframes.append(str(kf))

            # Build top shots summary
            top_shots = []
            for s in detailed_shots[:10]:
                top_shots.append({
                    "shot_id": s.get("shot_id"),
                    "start_time_sec": s.get("start_time_sec"),
                    "end_time_sec": s.get("end_time_sec"),
                    "duration_sec": s.get("duration_sec"),
                    "shot_scale": s.get("shot_scale", {}).get("predicted_class", "unknown"),
                    "lighting": s.get("cinematography", {}).get("lighting", {}).get("style", "unknown"),
                    "composition": s.get("cinematography", {}).get("composition", {}).get("detected_rule", "unknown")
                })

            return VideoCinematographyEvidence(
                status="available",
                engine_version=report.get("version", "2.0.0"),
                video_source=meta.get("source_file", resolved_video.name),
                duration_seconds=meta.get("duration_seconds", 0.0),
                resolution=meta.get("resolution", "N/A"),
                aspect_ratio=meta.get("aspect_ratio", "N/A"),
                total_scenes=exec_sum.get("total_scenes", 0),
                total_shots=exec_sum.get("total_shots", len(detailed_shots)),
                average_shot_length_sec=exec_sum.get("average_shot_length_sec", 0.0),
                pacing_rhythm=exec_sum.get("pacing_rhythm", "Moderate Cinematic Pacing"),
                cuts_per_minute=round((len(detailed_shots) / max(0.1, meta.get("duration_seconds", 1.0))) * 60.0, 2),
                predominant_shot_scale=exec_sum.get("predominant_shot_scale", "N/A"),
                predominant_lighting_style=exec_sum.get("predominant_lighting_style", "N/A"),
                audio_speech_activity=exec_sum.get("audio_speech_activity", "N/A"),
                shot_scale_distribution=cin_prof.get("shot_scale_breakdown", {}),
                lighting_style_distribution=cin_prof.get("lighting_style_breakdown", {}),
                composition_distribution=cin_prof.get("composition_breakdown", {}),
                keyframe_paths=keyframes,
                top_shots_summary=top_shots
            )
        except Exception as e:
            return VideoCinematographyEvidence(
                status="failed",
                error_message=f"ML_VIDEO analysis failed: {str(e)}"
            )
