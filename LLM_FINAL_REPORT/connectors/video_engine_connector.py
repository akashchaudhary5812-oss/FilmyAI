"""
Connector for the existing Multimodal Video Intelligence Engine (ML_VIDEO/).
Interfaces with ML_VIDEO.src.inference.video_analyzer.FilmyAIVideoEngine.
Uses the unified VideoResolver to handle both local uploads and remote URLs cleanly.
"""
import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional

from LLM_FINAL_REPORT.config import WORKSPACE_ROOT, ML_VIDEO_DIR, TEMP_DIR
from LLM_FINAL_REPORT.schemas.evidence_schema import VideoCinematographyEvidence

# Ensure workspace root is in sys.path for ML_VIDEO package imports
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from ML_VIDEO.src.preprocessing.video_resolver import (
    VideoResolver,
    ResolvedVideo,
    VideoResolutionError
)


class VideoEngineConnector:
    """
    Safely connects to and executes multimodal video intelligence analysis using ML_VIDEO.
    Normalizes local paths and public video URLs into a unified video interface.
    """
    def __init__(self):
        self._engine = None
        self._init_error = None
        self.resolver = VideoResolver(temp_dir=TEMP_DIR)

    def _get_engine(self):
        if self._engine is None and self._init_error is None:
            try:
                from ML_VIDEO.src.inference.video_analyzer import FilmyAIVideoEngine
                self._engine = FilmyAIVideoEngine()
            except Exception as e:
                self._init_error = str(e)
                print(f"[VideoEngineConnector] Warning: Failed to initialize FilmyAIVideoEngine: {e}")
        return self._engine

    def analyze(
        self,
        video_path: Optional[str] = None,
        video_url: Optional[str] = None,
        cast_members: Optional[List[Dict[str, Any]]] = None,
        keyframe_dir: Optional[str] = None,
        max_duration_sec: Optional[float] = None
    ) -> VideoCinematographyEvidence:
        """
        Resolves video input (local file or remote URL) and executes ML_VIDEO analysis
        with single-pass actor identification.
        Automatically cleans up temporary cached files after analysis completes.
        """
        target = video_path or video_url
        if not target:
            return VideoCinematographyEvidence(
                status="not_available",
                error_message="No video file or URL provided for analysis."
            )

        resolved_video: Optional[ResolvedVideo] = None
        try:
            # 1. Resolve Video target (Local file or remote URL)
            try:
                resolved_video = self.resolver.resolve(target)
            except VideoResolutionError as vre:
                print(f"[VideoEngineConnector] Video resolution error: {vre}")
                is_missing = "not found" in str(vre).lower() or "not a video" in str(vre).lower()
                status_str = "not_available" if is_missing else "failed"
                err_msg = "Valid video file could not be located or downloaded from input." if is_missing else f"Video resolution failed ({vre.stage}): {vre.message}"
                return VideoCinematographyEvidence(
                    status=status_str,
                    error_message=err_msg
                )
            except Exception as e:
                print(f"[VideoEngineConnector] Unexpected resolution error: {e}")
                return VideoCinematographyEvidence(
                    status="failed",
                    error_message=f"Failed to resolve video input: {str(e)}"
                )

            if not resolved_video.path.exists():
                return VideoCinematographyEvidence(
                    status="not_available",
                    error_message="Valid video file could not be located on disk."
                )

            # 2. Get ML_VIDEO engine
            engine = self._get_engine()
            if engine is None:
                return VideoCinematographyEvidence(
                    status="failed",
                    error_message=f"ML_VIDEO Engine initialization error: {self._init_error}"
                )

            # 3. Execute ML_VIDEO Multimodal Analysis with Cast Members
            report = engine.analyze_video(
                video_path=str(resolved_video.path),
                cast_members=cast_members,
                keyframe_dir=keyframe_dir,
                max_duration_sec=max_duration_sec
            )

            meta = report.get("film_metadata", {})
            exec_sum = report.get("executive_summary", {})
            cin_prof = report.get("cinematography_profile", {})
            detailed_shots = report.get("detailed_shots", [])
            cast_perf = report.get("cast_performance", [])

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
                video_source=meta.get("source_file", resolved_video.path.name),
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
                top_shots_summary=top_shots,
                # v3.0: Full shot detail list for deep scene scoring
                all_shots_detail=detailed_shots,
                audio_summary=report.get("audio_analysis", {}),
                pacing_metrics=report.get("pacing_metrics", {}),
                cast_performance=cast_perf
            )
        except Exception as e:
            return VideoCinematographyEvidence(
                status="failed",
                error_message=f"ML_VIDEO analysis failed: {str(e)}"
            )
        finally:
            # Deterministic cleanup of temporary downloaded videos
            if resolved_video:
                resolved_video.cleanup()

