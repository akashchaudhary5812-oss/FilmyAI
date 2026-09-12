"""
Scene and Shot Boundary Detection Module.
Uses PySceneDetect with adaptive content detection, with OpenCV fallback.
Supports chunked video streaming to prevent OOM on long movies.
"""
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import cv2

try:
    from scenedetect import detect, ContentDetector, AdaptiveDetector, open_video
    HAS_SCENEDETECT = True
except ImportError:
    HAS_SCENEDETECT = False


class FilmSceneDetector:
    """
    Detects shot and scene boundaries in film footage.
    """
    def __init__(self, threshold: float = 27.0, min_scene_len_sec: float = 0.8, adaptive: bool = True):
        self.threshold = threshold
        self.min_scene_len_sec = min_scene_len_sec
        self.adaptive = adaptive

    def detect_scenes(self, video_path: str, max_duration_sec: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Detect scene cuts and transitions in the input video.
        Returns list of shot/scene records with timestamps, frame numbers, and durations.
        """
        video_path = str(video_path)
        if not Path(video_path).exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        if HAS_SCENEDETECT:
            try:
                return self._detect_with_scenedetect(video_path, max_duration_sec)
            except Exception as e:
                print(f"[SceneDetector] PySceneDetect failed ({e}), falling back to OpenCV detector")
                return self._detect_with_opencv(video_path, max_duration_sec)
        else:
            return self._detect_with_opencv(video_path, max_duration_sec)

    def _detect_with_scenedetect(self, video_path: str, max_duration_sec: Optional[float] = None) -> List[Dict[str, Any]]:
        video = open_video(video_path)
        fps = video.frame_rate
        min_scene_len = int(fps * self.min_scene_len_sec)
        
        detector = AdaptiveDetector(adaptive_threshold=self.threshold, min_scene_len=min_scene_len) if self.adaptive else ContentDetector(threshold=self.threshold, min_scene_len=min_scene_len)
        scene_list = detect(video_path, detector)
        
        shots = []
        for idx, (start_time, end_time) in enumerate(scene_list):
            start_sec = getattr(start_time, "seconds", getattr(start_time, "get_seconds", lambda: 0.0)())
            end_sec = getattr(end_time, "seconds", getattr(end_time, "get_seconds", lambda: 0.0)())
            
            if max_duration_sec and start_sec >= max_duration_sec:
                break
            if max_duration_sec and end_sec > max_duration_sec:
                end_sec = max_duration_sec

            start_frame = getattr(start_time, "frame_num", getattr(start_time, "get_frames", lambda: 0)())
            end_frame = getattr(end_time, "frame_num", getattr(end_time, "get_frames", lambda: 0)())
            
            shots.append({
                "shot_id": idx + 1,
                "start_time_sec": round(start_sec, 3),
                "end_time_sec": round(end_sec, 3),
                "duration_sec": round(end_sec - start_sec, 3),
                "start_frame": start_frame,
                "end_frame": end_frame,
                "keyframe_indices": [start_frame + (end_frame - start_frame) // 2],
                "confidence": 0.95
            })
            
        if not shots:
            # If no cut detected, treat entire video as 1 shot
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps
            cap.release()
            shots.append({
                "shot_id": 1,
                "start_time_sec": 0.0,
                "end_time_sec": round(duration, 3),
                "duration_sec": round(duration, 3),
                "start_frame": 0,
                "end_frame": total_frames,
                "keyframe_indices": [total_frames // 2],
                "confidence": 1.0
            })
        return shots

    def _detect_with_opencv(self, video_path: str, max_duration_sec: Optional[float] = None) -> List[Dict[str, Any]]:
        """OpenCV HSV histogram delta-based shot transition detector."""
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        cuts = [0]
        prev_hist = None
        frame_idx = 0
        min_frames = int(fps * self.min_scene_len_sec)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            sec = frame_idx / fps
            if max_duration_sec and sec > max_duration_sec:
                break
                
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
            cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
            
            if prev_hist is not None:
                diff = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)
                if diff > 0.65 and (frame_idx - cuts[-1]) >= min_frames:
                    cuts.append(frame_idx)
            
            prev_hist = hist
            frame_idx += 1
            
        cap.release()
        cuts.append(frame_idx)
        
        shots = []
        for i in range(len(cuts) - 1):
            sf, ef = cuts[i], cuts[i+1]
            st = round(sf / fps, 3)
            et = round(ef / fps, 3)
            shots.append({
                "shot_id": i + 1,
                "start_time_sec": st,
                "end_time_sec": et,
                "duration_sec": round(et - st, 3),
                "start_frame": sf,
                "end_frame": ef,
                "keyframe_indices": [sf + (ef - sf) // 2],
                "confidence": 0.88
            })
        return shots
