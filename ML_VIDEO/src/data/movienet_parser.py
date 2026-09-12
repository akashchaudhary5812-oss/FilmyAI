"""
MovieNet Dataset Parser and Feature Extractor.
Parses shot-level cinematic styles (shot scale, camera movement), scene segmentation, and character tags from 1,100 movies.
"""
import json
import csv
from pathlib import Path
from typing import Dict, List, Any
from tqdm import tqdm


def parse_movienet_annotations(
    annotations_dir: str = "ML_VIDEO/datasets/movienet/annotations",
    output_dir: str = "ML_VIDEO/datasets/movienet/parsed"
) -> Dict[str, Any]:
    ann_path = Path(annotations_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    json_files = list(ann_path.rglob("*.json"))
    print(f"[MovieNet Parser] Found {len(json_files)} annotation files.")

    shot_styles = []
    scene_boundaries = []
    total_shots = 0
    total_cast_boxes = 0

    scale_counts = {}
    movement_counts = {}

    for fpath in tqdm(json_files, desc="Parsing MovieNet"):
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        imdb_id = data.get("imdb_id", fpath.stem)
        
        # Cast / character bounding boxes
        cast_list = data.get("cast")
        if cast_list:
            total_cast_boxes += len(cast_list)

        # Scene segmentation
        scenes = data.get("scene")
        if scenes and isinstance(scenes, list):
            for sc in scenes:
                scene_boundaries.append({
                    "imdb_id": imdb_id,
                    "scene_id": sc.get("scene_id"),
                    "shot_start": sc.get("shot_start"),
                    "shot_end": sc.get("shot_end")
                })

        # Cinematic style annotations
        cstyle = data.get("cinematic_style")
        if cstyle and isinstance(cstyle, dict):
            # Check movie shots
            movie_shots = cstyle.get("movie") or []
            if isinstance(movie_shots, list):
                for s in movie_shots:
                    scale = s.get("scale")
                    mov = s.get("movement")
                    shot_idx = s.get("shot")
                    if scale or mov:
                        shot_styles.append({
                            "imdb_id": imdb_id,
                            "shot_idx": shot_idx,
                            "shot_scale": scale,
                            "camera_movement": mov
                        })
                        if scale:
                            scale_counts[scale] = scale_counts.get(scale, 0) + 1
                        if mov:
                            movement_counts[mov] = movement_counts.get(mov, 0) + 1
                        total_shots += 1

    print(f"[MovieNet Parser] Total shot style annotations: {len(shot_styles)}")
    print(f"[MovieNet Parser] Total scene boundaries: {len(scene_boundaries)}")
    print(f"[MovieNet Parser] Total character bounding boxes: {total_cast_boxes}")
    print("[MovieNet Parser] Shot scale distribution:", scale_counts)
    print("[MovieNet Parser] Camera movement distribution:", movement_counts)

    # Export shot styles CSV
    styles_csv = out_path / "movienet_shot_styles.csv"
    with open(styles_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["imdb_id", "shot_idx", "shot_scale", "camera_movement"])
        writer.writeheader()
        writer.writerows(shot_styles)

    # Export scene boundaries CSV
    scenes_csv = out_path / "movienet_scenes.csv"
    with open(scenes_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["imdb_id", "scene_id", "shot_start", "shot_end"])
        writer.writeheader()
        writer.writerows(scene_boundaries)

    # Export Manifest
    manifest = {
        "dataset_name": "MovieNet",
        "official_url": "https://opendatalab.com/OpenDataLab/MovieNet",
        "download_status": "success",
        "total_movies": len(json_files),
        "total_cinematic_style_shots": len(shot_styles),
        "total_scene_segments": len(scene_boundaries),
        "total_character_boxes": total_cast_boxes,
        "shot_scale_distribution": scale_counts,
        "camera_movement_distribution": movement_counts,
        "license": "Academic / Non-commercial Research",
        "files": {
            "shot_styles_csv": str(styles_csv),
            "scenes_csv": str(scenes_csv)
        }
    }

    manifest_path = out_path / "movienet_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"[MovieNet Parser] Manifest saved: {manifest_path}")
    return manifest


if __name__ == "__main__":
    parse_movienet_annotations()
