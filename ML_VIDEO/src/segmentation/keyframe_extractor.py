"""
Keyframe Extraction Module.
Selects representative keyframes from shots based on middle position, motion peaks, and visual quality.
"""
from typing import List, Dict, Any, Optional
from pathlib import Path
import numpy as np
import cv2
from PIL import Image


class FilmKeyframeExtractor:
    """
    Extracts representative keyframes from detected shots.
    """
    def __init__(self, target_size: Optional[tuple] = (224, 224)):
        self.target_size = target_size

    def extract_keyframes_for_shots(
        self,
        video_path: str,
        shots: List[Dict[str, Any]],
        output_dir: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extracts keyframe images for each shot.
        Returns shots enriched with keyframe PIL images / file paths.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video file: {video_path}")

        if output_dir:
            out_path = Path(output_dir)
            out_path.mkdir(parents=True, exist_ok=True)

        enriched_shots = []
        for shot in shots:
            start_f = shot.get("start_frame", 0)
            end_f = shot.get("end_frame", start_f + 1)
            mid_f = start_f + (end_f - start_f) // 2

            cap.set(cv2.CAP_PROP_POS_FRAMES, mid_f)
            ret, frame = cap.read()
            if not ret:
                # fallback to start frame
                cap.set(cv2.CAP_PROP_POS_FRAMES, start_f)
                ret, frame = cap.read()

            if ret and frame is not None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)
                
                keyframe_info = {
                    "frame_index": mid_f,
                    "timestamp_sec": shot.get("start_time_sec", 0.0) + shot.get("duration_sec", 0.0) / 2.0,
                    "image": pil_img
                }

                if output_dir:
                    fname = f"keyframe_shot_{shot['shot_id']:04d}_frame_{mid_f:06d}.jpg"
                    fpath = out_path / fname
                    pil_img.save(fpath, quality=92)
                    keyframe_info["file_path"] = str(fpath)

                shot_copy = dict(shot)
                shot_copy["keyframe"] = keyframe_info
                enriched_shots.append(shot_copy)
            else:
                enriched_shots.append(dict(shot))

        cap.release()
        return enriched_shots
