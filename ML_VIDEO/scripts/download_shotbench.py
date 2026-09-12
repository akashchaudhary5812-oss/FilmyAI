"""
Fast chunked downloader for ShotBench images.tar with range resumption and auto-extraction.
"""
import os
import sys
import time
import tarfile
import urllib.request
from pathlib import Path

# Fix Windows stdout
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

URL = "https://huggingface.co/datasets/Vchitect/ShotBench/resolve/main/images.tar"
OUT_DIR = Path("ML_VIDEO/datasets/shotbench")
OUT_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR = OUT_DIR / "raw"
RAW_DIR.mkdir(exist_ok=True)
TAR_PATH = RAW_DIR / "images.tar"
EXTRACT_DIR = OUT_DIR / "images"
EXTRACT_DIR.mkdir(exist_ok=True)

CHUNK_SIZE = 4 * 1024 * 1024  # 4 MB

def download_file():
    current_size = TAR_PATH.stat().st_size if TAR_PATH.exists() else 0
    
    # Get total size
    req = urllib.request.Request(URL, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        total_size = int(resp.headers.get('Content-Length', 0))
    
    print(f"[ShotBench] Total size: {total_size / 1024 / 1024:.2f} MB")
    print(f"[ShotBench] Already downloaded: {current_size / 1024 / 1024:.2f} MB")
    
    if current_size >= total_size and total_size > 0:
        print("[ShotBench] File already fully downloaded.")
    else:
        headers = {'User-Agent': 'Mozilla/5.0'}
        mode = 'wb'
        if current_size > 0:
            headers['Range'] = f'bytes={current_size}-'
            mode = 'ab'
            print(f"[ShotBench] Resuming from byte {current_size}...")
            
        req = urllib.request.Request(URL, headers=headers)
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=60) as resp, open(TAR_PATH, mode) as f:
            downloaded = current_size
            last_report = time.time()
            while True:
                chunk = resp.read(CHUNK_SIZE)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                
                now = time.time()
                if now - last_report > 2.0:
                    speed = (downloaded - current_size) / (now - start_time) / 1024 / 1024
                    pct = (downloaded / total_size) * 100 if total_size else 0
                    print(f"[ShotBench] {pct:.1f}% | {downloaded / 1024 / 1024:.1f}/{total_size / 1024 / 1024:.1f} MB | {speed:.2f} MB/s", flush=True)
                    last_report = now
        print("[ShotBench] Download finished!")

    # Extract
    print(f"[ShotBench] Extracting archive ({TAR_PATH.stat().st_size / 1024 / 1024:.2f} MB) -> {EXTRACT_DIR}...")
    with tarfile.open(TAR_PATH, "r:") as tf:
        members = tf.getmembers()
        print(f"[ShotBench] Total files inside archive: {len(members)}")
        tf.extractall(EXTRACT_DIR)
    print(f"[ShotBench] Extraction complete! All {len(members)} images ready.")

if __name__ == "__main__":
    download_file()
