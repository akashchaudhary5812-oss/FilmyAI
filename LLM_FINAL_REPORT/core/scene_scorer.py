"""
Dynamic Scene Scorer for FilmyAI v3.0.

Computes evidence-driven scene-level scores from ML_VIDEO shot analysis.
Dynamically classifies scenes into High / Medium / Low performance tiers
using statistical percentile thresholds — never hardcoded counts.

Key principles:
  - Scores are computed only from available evidence; missing dimensions are excluded
  - Adjacent shots forming a continuous sequence are merged
  - Timestamps are validated against film duration
  - High/Medium/Low thresholds are computed from actual score distributions
"""
from __future__ import annotations

import math
from typing import List, Dict, Any, Optional, Tuple

from LLM_FINAL_REPORT.schemas.report_schema import (
    FilmHighPoint, FilmMediumPoint, FilmLowPoint,
    SceneTimelineEntry, ScenePerformanceTimeline,
    PacingRhythmMap, PacingSegment, TechnicalCreativePeak,
    TimestampedEvidence,
)
from LLM_FINAL_REPORT.schemas.evidence_schema import VideoCinematographyEvidence


# ---------------------------------------------------------------------------
# Configurable scoring weights (all must sum to 1.0 for normalization)
# ---------------------------------------------------------------------------
SCENE_SCORE_WEIGHTS: Dict[str, float] = {
    "shot_confidence":      0.20,   # ML model confidence on shot classification
    "lighting_harmony":     0.18,   # Lighting style score from aesthetics analyzer
    "composition_quality":  0.18,   # Composition rule detection quality
    "motion_stability":     0.16,   # Camera motion stability estimate
    "duration_balance":     0.14,   # Shot duration relative balance
    "audio_clarity":        0.14,   # Speech clarity / acoustic quality
}

# HIGH: upper percentile threshold for high point classification
HIGH_PERCENTILE_THRESHOLD = 70   # Top 30% are candidates for HIGH
HIGH_ABSOLUTE_FLOOR = 6.5        # Must also be above this absolute score

# LOW: lower percentile threshold for low point classification
LOW_PERCENTILE_THRESHOLD = 30    # Bottom 30% are candidates for LOW
LOW_ABSOLUTE_CEIL = 5.5          # Must also be below this absolute score

# Minimum evidence requirement: discard shots with very low confidence
MIN_SHOT_CONFIDENCE = 0.10

# Merge gap threshold: merge shots within this many seconds into one sequence
MERGE_GAP_SEC = 3.0


def _seconds_to_hms(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _validate_timestamp(start_sec: float, end_sec: float, duration_sec: float) -> bool:
    """Return True only if timestamps are valid within the film duration."""
    if duration_sec <= 0:
        return start_sec >= 0 and end_sec > start_sec
    return (
        start_sec >= 0 and
        end_sec > start_sec and
        start_sec <= duration_sec and
        end_sec <= duration_sec + 0.5  # allow 0.5s tolerance
    )


def _score_shot(shot: Dict[str, Any], avg_shot_len: float, audio_summary: Dict[str, Any]) -> Optional[Tuple[float, List[str]]]:
    """
    Compute a single shot score from available ML_VIDEO evidence.
    Returns (score, [dimensions_used]) or None if insufficient evidence.
    """
    dimensions_used = []
    weighted_sum = 0.0
    total_weight = 0.0

    # 1. Shot classification confidence
    shot_scale_data = shot.get("shot_scale", {})
    conf = float(shot_scale_data.get("confidence", 0.0)) if shot_scale_data else 0.0
    if conf >= MIN_SHOT_CONFIDENCE:
        score_contrib = min(1.0, conf) * 10.0
        weighted_sum += SCENE_SCORE_WEIGHTS["shot_confidence"] * score_contrib
        total_weight += SCENE_SCORE_WEIGHTS["shot_confidence"]
        dimensions_used.append("shot_confidence")

    # 2. Lighting harmony from aesthetics
    cinematography = shot.get("cinematography", {})
    lighting_data = cinematography.get("lighting", {}) if cinematography else {}
    lighting_conf = float(lighting_data.get("confidence", 0.0)) if lighting_data else 0.0
    if lighting_conf > 0:
        score_contrib = min(1.0, lighting_conf) * 10.0
        weighted_sum += SCENE_SCORE_WEIGHTS["lighting_harmony"] * score_contrib
        total_weight += SCENE_SCORE_WEIGHTS["lighting_harmony"]
        dimensions_used.append("lighting_harmony")

    # 3. Composition quality from aesthetics
    composition_data = cinematography.get("composition", {}) if cinematography else {}
    comp_conf = float(composition_data.get("confidence", 0.0)) if composition_data else 0.0
    if comp_conf > 0:
        score_contrib = min(1.0, comp_conf) * 10.0
        weighted_sum += SCENE_SCORE_WEIGHTS["composition_quality"] * score_contrib
        total_weight += SCENE_SCORE_WEIGHTS["composition_quality"]
        dimensions_used.append("composition_quality")

    # 4. Camera motion stability from multi-task predictions
    mt_preds = shot.get("multi_task_predictions", {}) if shot else {}
    motion_data = mt_preds.get("camera_movement", {}) if mt_preds else {}
    motion_conf = float(motion_data.get("confidence", 0.0)) if motion_data else 0.0
    if motion_conf > 0:
        # Stable shots (STATIC/SLOW PAN) get slightly higher base score
        motion_class = (motion_data.get("predicted_class") or "").upper()
        stability_bonus = 1.1 if motion_class in ("STATIC", "SLOW_PAN", "DOLLY") else 0.9
        score_contrib = min(10.0, motion_conf * 10.0 * stability_bonus)
        weighted_sum += SCENE_SCORE_WEIGHTS["motion_stability"] * score_contrib
        total_weight += SCENE_SCORE_WEIGHTS["motion_stability"]
        dimensions_used.append("motion_stability")

    # 5. Shot duration balance (relative to film average)
    dur = float(shot.get("duration_sec", 0.0))
    if dur > 0 and avg_shot_len > 0:
        # Balanced shots score closer to 8.0; very short or very long pull down
        ratio = dur / avg_shot_len
        balance_score = 10.0 - abs(1.0 - ratio) * 3.0
        balance_score = max(4.0, min(10.0, balance_score))
        weighted_sum += SCENE_SCORE_WEIGHTS["duration_balance"] * balance_score
        total_weight += SCENE_SCORE_WEIGHTS["duration_balance"]
        dimensions_used.append("duration_balance")

    # 6. Audio clarity from audio summary
    audio_conf = float(audio_summary.get("confidence", 0.0)) if audio_summary else 0.0
    audio_mode = (audio_summary.get("dominant_acoustic_mode") or "").upper()
    if audio_conf > 0:
        clarity_bonus = 1.1 if audio_mode in ("CLEAN_SPEECH", "MUSIC") else 0.9
        score_contrib = min(10.0, audio_conf * 10.0 * clarity_bonus)
        weighted_sum += SCENE_SCORE_WEIGHTS["audio_clarity"] * score_contrib
        total_weight += SCENE_SCORE_WEIGHTS["audio_clarity"]
        dimensions_used.append("audio_clarity")

    if total_weight == 0 or not dimensions_used:
        return None

    normalized_score = round(weighted_sum / total_weight, 2)
    return normalized_score, dimensions_used


def _merge_adjacent_shots(
    scored_shots: List[Dict[str, Any]],
    merge_gap_sec: float = MERGE_GAP_SEC
) -> List[Dict[str, Any]]:
    """
    Merge adjacent shots that belong to a continuous sequence
    (gap between end of shot[i] and start of shot[i+1] <= merge_gap_sec).
    Returns merged group records.
    """
    if not scored_shots:
        return []

    sorted_shots = sorted(scored_shots, key=lambda s: s["start_sec"])
    merged = []
    group = [sorted_shots[0]]

    for shot in sorted_shots[1:]:
        prev = group[-1]
        gap = shot["start_sec"] - prev["end_sec"]
        if gap <= merge_gap_sec:
            group.append(shot)
        else:
            merged.append(group)
            group = [shot]
    merged.append(group)

    result = []
    for group in merged:
        scores = [s["score"] for s in group if s.get("score") is not None]
        avg_score = round(sum(scores) / len(scores), 2) if scores else None
        dims = list({d for s in group for d in s.get("dimensions", [])})
        evidences = []
        for s in group:
            evidences.extend(s.get("evidence", []))
        result.append({
            "start_sec": group[0]["start_sec"],
            "end_sec": group[-1]["end_sec"],
            "shot_count": len(group),
            "score": avg_score,
            "dimensions": dims,
            "evidence": list(dict.fromkeys(evidences))[:5],
            "shot_ids": [s.get("shot_id") for s in group],
        })
    return result


def _percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    idx = (pct / 100.0) * (len(sorted_vals) - 1)
    lower = sorted_vals[int(idx)]
    upper = sorted_vals[min(int(idx) + 1, len(sorted_vals) - 1)]
    return lower + (upper - lower) * (idx - int(idx))


class SceneScorer:
    """
    Dynamically scores, classifies, and structures scene-level intelligence
    from ML_VIDEO shot analysis evidence.
    """

    def __init__(self, video_evidence: VideoCinematographyEvidence):
        self.vid = video_evidence
        self.duration = video_evidence.duration_seconds
        self.avg_shot_len = video_evidence.average_shot_length_sec or 5.0
        self.audio_summary = video_evidence.audio_summary or {}
        self.shots = video_evidence.all_shots_detail or []

    def _score_all_shots(self) -> List[Dict[str, Any]]:
        """Score every shot and return flat list with scores."""
        scored = []
        for shot in self.shots:
            result = _score_shot(shot, self.avg_shot_len, self.audio_summary)
            if result is None:
                continue
            score, dims = result
            start = float(shot.get("start_time_sec", 0.0))
            end = float(shot.get("end_time_sec", start + float(shot.get("duration_sec", 0.0))))
            if not _validate_timestamp(start, end, self.duration):
                continue

            shot_scale = shot.get("shot_scale", {}).get("predicted_class", "unknown")
            lighting = shot.get("cinematography", {}).get("lighting", {}).get("style", "N/A")
            scored.append({
                "shot_id": shot.get("shot_id"),
                "start_sec": start,
                "end_sec": end,
                "score": score,
                "dimensions": dims,
                "evidence": [
                    f"Shot scale: {shot_scale}",
                    f"Lighting: {lighting}",
                ],
            })
        return scored

    def build_timeline(self) -> ScenePerformanceTimeline:
        """Build chronological scene performance timeline."""
        scored_shots = self._score_all_shots()
        if not scored_shots:
            return ScenePerformanceTimeline(
                film_duration_sec=self.duration,
                confidence="LOW"
            )

        merged = _merge_adjacent_shots(scored_shots)
        entries: List[SceneTimelineEntry] = []
        scores = []

        for seg in merged:
            s_sec = seg["start_sec"]
            e_sec = seg["end_sec"]
            sc = seg["score"]
            if sc is not None:
                scores.append(sc)

            # Pacing label
            seg_dur = e_sec - s_sec
            shot_cnt = seg.get("shot_count", 1)
            local_avg = seg_dur / max(1, shot_cnt)
            if local_avg < 2.5:
                pacing_label = "Fast / Kinetic"
            elif local_avg < 5.0:
                pacing_label = "Moderate Cinematic"
            elif local_avg < 9.0:
                pacing_label = "Slow Dramatic"
            else:
                pacing_label = "Contemplative"

            entries.append(SceneTimelineEntry(
                timestamp_range=f"{_seconds_to_hms(s_sec)} - {_seconds_to_hms(e_sec)}",
                timestamp_start=_seconds_to_hms(s_sec),
                timestamp_end=_seconds_to_hms(e_sec),
                timestamp_start_sec=s_sec,
                timestamp_end_sec=e_sec,
                scene_score=sc,
                dominant_category="CINEMATOGRAPHY",
                confidence="MEDIUM" if sc is not None else "LOW",
                visual_evidence=", ".join(seg.get("evidence", [])[:2]),
                shot_count=shot_cnt,
                pacing_label=pacing_label,
            ))

        avg = round(sum(scores) / len(scores), 2) if scores else None
        std = None
        if scores and avg is not None:
            variance = sum((s - avg) ** 2 for s in scores) / len(scores)
            std = round(math.sqrt(variance), 2)

        confidence = "HIGH" if len(scores) >= 8 else ("MEDIUM" if len(scores) >= 3 else "LOW")

        return ScenePerformanceTimeline(
            entries=entries,
            film_duration_sec=self.duration,
            total_scenes_evaluated=len(entries),
            average_scene_score=avg,
            score_std_deviation=std,
            confidence=confidence,
        )

    def classify_high_medium_low(
        self,
        merged_segments: List[Dict[str, Any]]
    ) -> Tuple[List[FilmHighPoint], List[FilmMediumPoint], List[FilmLowPoint]]:
        """
        Classify merged segments into HIGH / MEDIUM / LOW using statistical percentiles.
        Counts are ENTIRELY dynamic — never hardcoded.
        """
        valid = [seg for seg in merged_segments if seg.get("score") is not None]
        if not valid:
            return [], [], []

        scores = [seg["score"] for seg in valid]
        p_high = _percentile(scores, HIGH_PERCENTILE_THRESHOLD)
        p_low = _percentile(scores, LOW_PERCENTILE_THRESHOLD)

        highs: List[FilmHighPoint] = []
        mediums: List[FilmMediumPoint] = []
        lows: List[FilmLowPoint] = []

        for seg in valid:
            sc = seg["score"]
            s_sec = seg["start_sec"]
            e_sec = seg["end_sec"]
            ev = seg.get("evidence", [])
            ts = f"{_seconds_to_hms(s_sec)} - {_seconds_to_hms(e_sec)}"

            if sc >= p_high and sc >= HIGH_ABSOLUTE_FLOOR:
                conf = "HIGH" if sc >= 8.0 else "MEDIUM"
                highs.append(FilmHighPoint(
                    timestamp_start=_seconds_to_hms(s_sec),
                    timestamp_end=_seconds_to_hms(e_sec),
                    timestamp_start_sec=s_sec,
                    timestamp_end_sec=e_sec,
                    scene_description=f"Scene sequence {ts}",
                    scene_score=sc,
                    why_it_works=f"This sequence scores {sc}/10, placing it in the top-performing tier. "
                                 f"Evidence: {'; '.join(ev[:3]) or 'Multi-dimensional cinematography quality.'}",
                    cinematography_strength=min(10.0, sc + 0.3),
                    evidence=ev,
                    confidence=conf,
                ))
            elif sc <= p_low and sc <= LOW_ABSOLUTE_CEIL:
                conf = "MEDIUM" if sc < 4.5 else "LOW"
                lows.append(FilmLowPoint(
                    timestamp_start=_seconds_to_hms(s_sec),
                    timestamp_end=_seconds_to_hms(e_sec),
                    timestamp_start_sec=s_sec,
                    timestamp_end_sec=e_sec,
                    scene_description=f"Scene sequence {ts}",
                    scene_score=sc,
                    primary_issue="Below-average cinematic quality based on available ML_VIDEO evidence.",
                    secondary_issues=[f"Evidence: {e}" for e in ev[:2]],
                    affected_category="CINEMATOGRAPHY",
                    recommendation="Review shot framing, lighting consistency, and editing rhythm in this segment.",
                    evidence=ev,
                    confidence=conf,
                ))
            else:
                mediums.append(FilmMediumPoint(
                    timestamp_start=_seconds_to_hms(s_sec),
                    timestamp_end=_seconds_to_hms(e_sec),
                    timestamp_start_sec=s_sec,
                    timestamp_end_sec=e_sec,
                    scene_score=sc,
                    what_works=f"Functional cinematic execution (score {sc}/10) meeting mid-tier thresholds.",
                    what_is_average="Some dimensions show average performance without distinctive highlights.",
                    improvement_area="Stronger lighting contrast or more defined shot composition could elevate this segment.",
                    evidence=ev,
                    confidence="MEDIUM",
                ))

        return highs, mediums, lows

    def build_technical_peaks(
        self, merged_segments: List[Dict[str, Any]]
    ) -> List[TechnicalCreativePeak]:
        """Identify top-scoring moments where multiple dimensions align strongly."""
        valid = [s for s in merged_segments if s.get("score") is not None and s["score"] >= 8.0]
        valid.sort(key=lambda s: s["score"], reverse=True)

        peaks: List[TechnicalCreativePeak] = []
        for seg in valid[:10]:  # cap at 10 peaks
            sc = seg["score"]
            s_sec = seg["start_sec"]
            e_sec = seg["end_sec"]
            dims = seg.get("dimensions", [])
            if len(dims) < 2:
                continue  # require at least 2 dimensions
            peaks.append(TechnicalCreativePeak(
                timestamp_range=f"{_seconds_to_hms(s_sec)} - {_seconds_to_hms(e_sec)}",
                timestamp_start=_seconds_to_hms(s_sec),
                timestamp_end=_seconds_to_hms(e_sec),
                timestamp_start_sec=s_sec,
                timestamp_end_sec=e_sec,
                cinematography_score=min(10.0, sc + 0.2) if "composition_quality" in dims else None,
                audio_score=min(10.0, sc + 0.1) if "audio_clarity" in dims else None,
                overall_peak_score=sc,
                reason=(
                    f"Score {sc}/10 with {len(dims)} active analysis dimensions. "
                    f"Dimensions: {', '.join(dims[:4])}."
                ),
                evidence=seg.get("evidence", []),
                confidence="HIGH" if sc >= 8.5 else "MEDIUM",
                dimensions_available=dims,
            ))
        return peaks

    def build_pacing_map(self) -> PacingRhythmMap:
        """Build pacing & rhythm analysis from ML_VIDEO evidence."""
        scored_shots = self._score_all_shots()
        merged = _merge_adjacent_shots(scored_shots)

        pacing_segs: List[PacingSegment] = []
        slow_sections: List[str] = []
        drag_points: List[str] = []
        rushed_sections: List[str] = []
        peak_moments: List[str] = []

        for seg in merged:
            s_sec = seg["start_sec"]
            e_sec = seg["end_sec"]
            seg_dur = e_sec - s_sec
            shot_cnt = max(1, seg.get("shot_count", 1))
            local_avg = seg_dur / shot_cnt
            score = seg.get("score")
            ts_range = f"{_seconds_to_hms(s_sec)} - {_seconds_to_hms(e_sec)}"

            if local_avg >= 9.0:
                pacing_label = "SLOW"
                slow_sections.append(ts_range)
                if score is not None and score < 5.5:
                    drag_points.append(ts_range)
            elif local_avg < 2.5:
                pacing_label = "ACCELERATED"
                rushed_sections.append(ts_range)
            else:
                pacing_label = "BALANCED"

            if score is not None and score >= 8.0:
                peak_moments.append(ts_range)

            pacing_segs.append(PacingSegment(
                timestamp_start=_seconds_to_hms(s_sec),
                timestamp_end=_seconds_to_hms(e_sec),
                pacing_label=pacing_label,
                avg_shot_length_sec=round(local_avg, 2),
                scene_density=round(shot_cnt / max(1.0, seg_dur) * 60.0, 2),
                notes=f"Shot density: {shot_cnt} shots, avg {local_avg:.1f}s/shot",
                confidence="MEDIUM" if score is not None else "LOW",
            ))

        overall = self.vid.pacing_rhythm or "Moderate Cinematic Narrative Pacing"
        confidence = "HIGH" if len(pacing_segs) >= 5 else ("MEDIUM" if pacing_segs else "LOW")

        return PacingRhythmMap(
            overall_rhythm=overall,
            pacing_segments=pacing_segs,
            slow_sections=slow_sections,
            drag_points=drag_points,
            rushed_sections=rushed_sections,
            peak_intensity_moments=peak_moments,
            pacing_consistency=(
                "Consistent pacing across all analyzed scenes."
                if not drag_points else
                f"{len(drag_points)} potential drag point(s) identified requiring editorial review."
            ),
            transition_quality="Based on available ML_VIDEO shot boundary analysis.",
            confidence=confidence,
        )

    def compute_all(self) -> Dict[str, Any]:
        """
        Entry point: compute all scene-level scoring artifacts.
        Returns a dict with timeline, high/medium/low points, peaks, pacing map.
        """
        scored_shots = self._score_all_shots()
        merged = _merge_adjacent_shots(scored_shots)

        timeline = self.build_timeline()
        highs, mediums, lows = self.classify_high_medium_low(merged)
        peaks = self.build_technical_peaks(merged)
        pacing = self.build_pacing_map()

        return {
            "timeline": timeline,
            "high_points": highs,
            "medium_points": mediums,
            "low_points": lows,
            "technical_peaks": peaks,
            "pacing_map": pacing,
            "scored_shots": scored_shots,
            "merged_segments": merged,
        }
