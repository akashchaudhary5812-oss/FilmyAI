"""
Download MovieNet annotations (MovieNet.tar.gz, 846 MB) from OpenDataLab.
Does NOT download the 160 GB keyframe videos.
"""
import os
import sys

# Fix Windows cp1252 encoding issue - openxlab library prints Chinese characters
sys.stdout.reconfigure(encoding='utf-8')
os.environ['PYTHONIOENCODING'] = 'utf-8'

from pathlib import Path

# Load credentials
env = {}
for line in Path('ML_VIDEO/.env').read_text().strip().splitlines():
    if '=' in line:
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")

AK = env['ACCESS_KEY_OPENDATALAB']
SK = env['SECREST_KEY_OPENDATALAB']

import openxlab
openxlab.login(ak=AK, sk=SK)
print("[MovieNet] Login OK")

from openxlab.dataset import download

target = Path('ML_VIDEO/datasets/movienet/raw')
target.mkdir(parents=True, exist_ok=True)

print(f"[MovieNet] Downloading MovieNet.tar.gz (~846 MB) -> {target}")
print("[MovieNet] This is annotations ONLY (not the 160 GB keyframes)")

download(
    dataset_repo='OpenDataLab/MovieNet',
    source_path='/raw/MovieNet.tar.gz',
    target_path=str(target)
)

print(f"[MovieNet] Download complete. Checking file...")
tar_path = target / 'raw' / 'MovieNet.tar.gz'
if not tar_path.exists():
    # Try alternate path
    for f in target.rglob('*.tar.gz'):
        tar_path = f
        break

if tar_path.exists():
    size_mb = tar_path.stat().st_size / (1024**2)
    print(f"[MovieNet] File: {tar_path}")
    print(f"[MovieNet] Size: {size_mb:.1f} MB")

    # Extract
    print(f"[MovieNet] Extracting...")
    import tarfile
    extract_dir = Path('ML_VIDEO/datasets/movienet/extracted')
    extract_dir.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path, 'r:gz') as tf:
        members = tf.getmembers()
        print(f"[MovieNet] Archive contains {len(members)} files")
        tf.extractall(extract_dir)
    print(f"[MovieNet] Extraction complete → {extract_dir}")

    # List top-level structure
    print("[MovieNet] Top-level extracted structure:")
    for item in sorted(extract_dir.rglob('*'))[:30]:
        print(f"  {item.relative_to(extract_dir)}")
else:
    print(f"[MovieNet] ERROR: could not find downloaded tar.gz under {target}")
    import subprocess
    result = subprocess.run(['python', '-c', f"from pathlib import Path; [print(f) for f in Path('ML_VIDEO/datasets/movienet').rglob('*')]"], capture_output=True, text=True)
    print(result.stdout)
