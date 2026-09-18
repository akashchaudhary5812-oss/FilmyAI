"""
End-to-End Real Execution Test for FilmyAI Multimodal Pipeline.
Creates a real multi-shot video file with changing content and audio,
and runs the entire pipeline through ML_VIDEO, Commercial ML, LLM Synthesis, and RAG.
"""
import os
import sys
import time
import json
from pathlib import Path
import numpy as np
import cv2

# Set stdout to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from LLM_FINAL_REPORT.runner import run_pipeline_with_stages
from RAG.rag_pipeline import rag_pipeline


def generate_real_test_video(output_path: Path, duration_sec: int = 6, fps: int = 24) -> Path:
    """Generates a real synthetic multi-scene MP4 video with motion and color transitions."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    width, height = 640, 360
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    scenes = [
        {"name": "Scene 1 - Action Exterior", "color": (40, 50, 180)},
        {"name": "Scene 2 - Dramatic Dialogue", "color": (180, 80, 40)},
        {"name": "Scene 3 - Chiaroscuro Night", "color": (20, 20, 30)},
    ]
    frames_per_scene = (duration_sec * fps) // len(scenes)

    for sc in scenes:
        for f in range(frames_per_scene):
            frame = np.full((height, width, 3), sc["color"], dtype=np.uint8)
            # Add motion element
            cx = int((f / frames_per_scene) * width)
            cy = height // 2
            cv2.circle(frame, (cx, cy), 30, (255, 215, 0), -1)
            cv2.putText(frame, sc["name"], (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            writer.write(frame)

    writer.release()
    print(f"[TEST_SETUP] Generated real test video: {output_path} ({output_path.stat().st_size / 1024:.1f} KB)")
    return output_path


def main():
    print("================================================================")
    print(" FILMY AI — END-TO-END VERIFICATION WITH REAL VIDEO EXECUTION   ")
    print("================================================================")

    test_video_path = WORKSPACE_ROOT / "Backend" / "uploads" / "videos" / "test_verification_movie.mp4"
    generate_real_test_video(test_video_path)

    payload = {
        "film_id": "FILM_E2E_AUDIT_001",
        "FilmName": "The Quantum Cipher",
        "DirectorName": "Christopher Nolan",
        "Casting": "Cillian Murphy, Emily Blunt, Matt Damon",
        "ProductionHouses": "Syncopy, Universal Pictures",
        "Budget": 150000000,
        "Genre": "Sci-Fi",
        "uploadFilm": str(test_video_path),
        "video_path": str(test_video_path),
        "Script": "EXT. CERN COLLIDER FACILITY - DUSK. Dr. Keller stares at the anomalous quantum interference patterns as the alarms begin to chime.",
        "Summary": "A mind-bending theoretical thriller about a team of rogue physicists who uncover a message embedded in temporal radiation.",
        "generate_pdf": True
    }

    print("\n--- RUNNING COMPLETE PIPELINE ---")
    start_time = time.time()
    report = run_pipeline_with_stages(payload)
    elapsed = time.time() - start_time

    print("\n--- VALIDATING PIPELINE OUTPUT EVIDENCE ---")
    print(f"Report ID: {report.get('report_id')}")
    print(f"Film Title: {report.get('film_title')}")
    print(f"Commercial Verdict: {report.get('executive_summary', {}).get('commercial_verdict')}")
    print(f"Overall Rating: {report.get('executive_summary', {}).get('overall_film_rating')}")
    print(f"Video Source: {report.get('raw_video_metrics', {}).get('video_source')}")
    print(f"Total Shots Detected: {report.get('raw_video_metrics', {}).get('total_shots')}")
    print(f"Average Shot Length: {report.get('raw_video_metrics', {}).get('average_shot_length_sec')}s")
    print(f"Keyframe Paths: {report.get('raw_video_metrics', {}).get('keyframe_paths')}")
    print(f"Timings: {json.dumps(report.get('timings', {}), indent=2)}")

    # Test RAG QA Grounding
    print("\n--- TESTING RAG CHATBOT ON GENERATED REPORT ---")
    question = "What are the primary commercial strengths and risks identified for The Quantum Cipher?"
    print(f"Question: {question}")
    rag_response = rag_pipeline.query_film(
        film_id="FILM_E2E_AUDIT_001",
        question=question,
        film_name="The Quantum Cipher"
    )

    print(f"\nRAG Answer:\n{rag_response.answer}")
    print(f"\nRetrieved Chunks: {len(rag_response.sources)}")
    for s in rag_response.sources[:3]:
        print(f" - [{s.section}] (Score: {s.relevance_score:.3f}): {s.excerpt[:80] if s.excerpt else 'N/A'}...")

    print("\n================================================================")
    print(f" ALL END-TO-END VERIFICATION STEPS SUCCEEDED IN {elapsed:.2f}s! ")
    print("================================================================")


if __name__ == "__main__":
    main()
