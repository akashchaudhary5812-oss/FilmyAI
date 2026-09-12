"""
Film Intelligence JSON Aggregator and Schema Validator.
Formats raw model outputs, scene cuts, audio classification, and lighting/composition metrics
into a unified, rich film analysis JSON document conforming to FILMY AI specs.
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


def generate_film_intelligence_report(
    video_path: str,
    metadata: Dict[str, Any],
    shots_analysis: List[Dict[str, Any]],
    scene_segments: List[Dict[str, Any]],
    audio_summary: Dict[str, Any],
    pacing_metrics: Dict[str, Any],
    output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assembles all multimodal analysis results into the final FilmyAI Video Intelligence JSON structure.
    """
    total_shots = len(shots_analysis)
    total_scenes = len(scene_segments)
    video_duration = metadata.get("duration_seconds", 0.0)

    # Compute global shot scale distribution
    scale_dist = {}
    lighting_dist = {}
    composition_dist = {}

    for s in shots_analysis:
        scale = s.get("shot_scale", {}).get("predicted_class", "unknown")
        scale_dist[scale] = scale_dist.get(scale, 0) + 1

        light = s.get("cinematography", {}).get("lighting", {}).get("style", "unknown")
        lighting_dist[light] = lighting_dist.get(light, 0) + 1

        comp = s.get("cinematography", {}).get("composition", {}).get("detected_rule", "unknown")
        composition_dist[comp] = composition_dist.get(comp, 0) + 1

    report = {
        "engine": "FILMY_AI_Video_Intelligence_Engine",
        "version": "2.0.0",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "film_metadata": {
            "source_file": Path(video_path).name,
            "duration_seconds": round(video_duration, 2),
            "total_frames": metadata.get("total_frames", 0),
            "fps": metadata.get("fps", 24.0),
            "resolution": metadata.get("resolution", "1920x1080"),
            "aspect_ratio": metadata.get("aspect_ratio", "16:9")
        },
        "executive_summary": {
            "total_scenes": total_scenes,
            "total_shots": total_shots,
            "average_shot_length_sec": round(video_duration / max(1, total_shots), 2),
            "pacing_rhythm": pacing_metrics.get("rhythm_classification", "Moderate Cinematic Pacing"),
            "predominant_shot_scale": max(scale_dist.items(), key=lambda x: x[1])[0] if scale_dist else "N/A",
            "predominant_lighting_style": max(lighting_dist.items(), key=lambda x: x[1])[0] if lighting_dist else "N/A",
            "audio_speech_activity": audio_summary.get("dominant_acoustic_mode", "N/A")
        },
        "cinematography_profile": {
            "shot_scale_breakdown": {k: {"count": v, "percentage": round(v / max(1, total_shots) * 100, 1)} for k, v in scale_dist.items()},
            "lighting_style_breakdown": {k: {"count": v, "percentage": round(v / max(1, total_shots) * 100, 1)} for k, v in lighting_dist.items()},
            "composition_breakdown": {k: {"count": v, "percentage": round(v / max(1, total_shots) * 100, 1)} for k, v in composition_dist.items()}
        },
        "scene_breakdown": scene_segments,
        "detailed_shots": shots_analysis,
        "audio_intelligence": audio_summary
    }

    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"[JSON Exporter] Film Intelligence Report saved: {out_file}")

    return report
