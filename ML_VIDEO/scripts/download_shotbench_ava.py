"""
Download ShotBench dataset (images.tar ~2.07 GB) from HuggingFace.
Apache 2.0 license. No login required.
Also downloads AVA Speech CSV (~5 MB).
"""
import os
import io
import tarfile
import json
import csv
import urllib.request
from pathlib import Path

print("="*60)
print("SHOTBENCH DOWNLOAD")
print("="*60)

# --- ShotBench ---
from huggingface_hub import hf_hub_download

# Step 1: Download test.tsv (already cached, tiny)
print("[ShotBench] Downloading test.tsv manifest...")
tsv_path = hf_hub_download(
    repo_id='Vchitect/ShotBench',
    filename='test.tsv',
    repo_type='dataset'
)
print(f"[ShotBench] TSV at: {tsv_path}")

# Count items
with open(tsv_path, encoding='utf-8') as f:
    rows = list(csv.DictReader(f, delimiter='\t'))
print(f"[ShotBench] Total QA pairs: {len(rows)}")

# Step 2: Download images.tar (~2.07 GB)
shotbench_dir = Path('ML_VIDEO/datasets/shotbench')
shotbench_dir.mkdir(parents=True, exist_ok=True)
images_dir = shotbench_dir / 'images'
images_dir.mkdir(exist_ok=True)

print(f"[ShotBench] Downloading images.tar (~2.07 GB)...")
images_tar_path = hf_hub_download(
    repo_id='Vchitect/ShotBench',
    filename='images.tar',
    repo_type='dataset',
    local_dir=str(shotbench_dir / 'raw')
)
print(f"[ShotBench] images.tar downloaded: {images_tar_path}")

# Extract
print("[ShotBench] Extracting images...")
with tarfile.open(images_tar_path, 'r:') as tf:
    members = tf.getmembers()
    print(f"[ShotBench] Archive has {len(members)} items")
    tf.extractall(str(images_dir))
print(f"[ShotBench] Extracted to {images_dir}")

# Copy TSV
import shutil
shutil.copy(tsv_path, shotbench_dir / 'test.tsv')
print(f"[ShotBench] TSV copied to {shotbench_dir / 'test.tsv'}")

# Parse and build per-category manifests
print("[ShotBench] Parsing annotations into category manifests...")
categories = {}
image_hits = 0
for row in rows:
    if '"image"' in row.get('type', ''):
        cat = row.get('category', '').strip()
        if cat not in categories:
            categories[cat] = []
        # Parse options dict and find correct answer
        try:
            import ast
            path_str = row.get('path', '[]')
            paths = ast.literal_eval(path_str)
            img_path = paths[0] if paths else None
            options = json.loads(row['options'])
            answer_key = row['answer'].strip()
            answer_label = options.get(answer_key, answer_key)
            categories[cat].append({
                'image': img_path,
                'answer_key': answer_key,
                'answer_label': answer_label,
                'options': options,
                'question': row['question']
            })
            image_hits += 1
        except Exception as e:
            pass

print(f"[ShotBench] Image-based QA pairs: {image_hits}")
for cat, items in sorted(categories.items()):
    print(f"  {cat}: {len(items)} samples")

# Save manifests
for cat, items in categories.items():
    fname = cat.replace(' ', '_').replace('/', '_')
    out_path = shotbench_dir / f'annotations_{fname}.json'
    with open(out_path, 'w') as f:
        json.dump(items, f, indent=2)
    print(f"[ShotBench] Saved: {out_path.name} ({len(items)} samples)")

print("\n" + "="*60)
print("AVA SPEECH LABELS DOWNLOAD")
print("="*60)

ava_dir = Path('ML_VIDEO/datasets/ava')
ava_dir.mkdir(parents=True, exist_ok=True)

ava_url = 'https://research.google.com/ava/download/ava_speech_labels_v1.csv'
ava_path = ava_dir / 'ava_speech_labels_v1.csv'

print(f"[AVA Speech] Downloading from {ava_url}")
req = urllib.request.Request(ava_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as r:
    data = r.read()
    with open(ava_path, 'wb') as f:
        f.write(data)

# Parse
lines = data.decode('utf-8').strip().splitlines()
label_counts = {}
for line in lines:
    parts = line.split(',')
    if len(parts) >= 4:
        label = parts[3].strip()
        label_counts[label] = label_counts.get(label, 0) + 1

size_kb = ava_path.stat().st_size / 1024
print(f"[AVA Speech] Downloaded: {ava_path} ({size_kb:.1f} KB)")
print(f"[AVA Speech] Total segments: {len(lines)}")
print(f"[AVA Speech] Label distribution:")
for lbl, cnt in sorted(label_counts.items(), key=lambda x: -x[1]):
    print(f"  {lbl}: {cnt}")

print("\n[ALL DOWNLOADS COMPLETE]")
