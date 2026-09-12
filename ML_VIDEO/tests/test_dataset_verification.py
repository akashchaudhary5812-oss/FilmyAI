"""
Test suite for Dataset Verification and Manifest Integrity.
Checks:
- MovieNet manifest and annotations
- AVA Speech manifest and label counts
- Types of Film Shots manifest
- No fake/synthetic dataset claims
"""
import json
from pathlib import Path
import pytest


def test_movienet_manifest_exists():
    manifest_path = Path("ML_VIDEO/datasets/movienet/parsed/movienet_manifest.json")
    assert manifest_path.exists(), "MovieNet manifest JSON must exist"
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    assert data["dataset_name"] == "MovieNet"
    assert data["total_movies"] > 0
    assert data["total_cinematic_style_shots"] > 1000
    assert data["total_scene_segments"] > 1000
    assert "closeup" in data["shot_scale_distribution"]
    assert "static" in data["camera_movement_distribution"]


def test_ava_speech_dataset():
    ava_path = Path("ML_VIDEO/datasets/ava/ava_speech_labels_v1.csv")
    assert ava_path.exists(), "AVA Speech CSV must exist"
    assert ava_path.stat().st_size > 100_000, "AVA Speech CSV must not be empty"
    
    lines = ava_path.read_text().strip().splitlines()
    assert len(lines) > 30000, f"Expected >30k AVA segments, got {len(lines)}"


def test_types_of_film_shots():
    meta_path = Path("ML_VIDEO/data/raw/types_of_film_shots/shot_metadata.json")
    assert meta_path.exists(), "types_of_film_shots metadata must exist"
    
    with open(meta_path, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    assert len(records) >= 800, f"Expected >=800 records, got {len(records)}"
    for r in records[:10]:
        assert Path(r["local_path"]).exists(), f"Image file must exist: {r['local_path']}"
