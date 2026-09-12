"""
End-to-end Pipeline Integration Test for FilmyAI Report Generation.
"""
import os
import pytest
from pathlib import Path
from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest


def test_end_to_end_pipeline_generation(tmp_path):
    """Executes full pipeline and verifies output JSON and PDF files."""
    pipeline = FilmyAIReportPipeline(output_dir=tmp_path)

    request_data = {
        "FilmName": "Brahmāstra: Part Two - Dev",
        "DirectorName": "Ayan Mukerji",
        "Casting": "Ranbir Kapoor, Alia Bhatt, Deepika Padukone, Ranveer Singh",
        "ProductionHouses": "Dharma Productions, Star Studios",
        "Budget": "350000000",
        "Genre": "Action",
        "Script": "EXT. HIMALAYAN SUMMIT - DUSK. Shiva channels the Agnyastra as skies split with crimson lightning.",
        "Summary": "The ancient astras awaken as Dev seeks ultimate dominion across modern India.",
        "generate_pdf": True
    }

    report = pipeline.generate_report(request_data)

    assert report is not None
    assert report.film_title == "Brahmāstra: Part Two - Dev"
    assert report.executive_summary.film_title == "Brahmāstra: Part Two - Dev"
    assert report.story_provenance["script_source"] == "USER_PROVIDED"
    assert report.story_provenance["summary_source"] == "USER_PROVIDED"
    assert report.story_provenance["case_mode"] == "CASE_1"

    # Verify JSON file created
    assert report.json_report_path is not None
    assert Path(report.json_report_path).exists()
    assert Path(report.json_report_path).stat().st_size > 500

    # Verify PDF file created
    assert report.pdf_report_path is not None
    assert Path(report.pdf_report_path).exists()
    assert Path(report.pdf_report_path).stat().st_size > 1000


def test_end_to_end_with_real_video_analysis(tmp_path):
    """Tests the full multimodal pipeline including ML_VIDEO video processing and Case 4 priority."""
    import cv2
    import numpy as np

    # Create a small multi-shot video
    video_path = tmp_path / "test_film_scene.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(video_path), fourcc, 24, (320, 240))
    for color in [(200, 50, 50), (50, 200, 50), (50, 50, 200)]:
        frame = np.full((240, 320, 3), color, dtype=np.uint8)
        for _ in range(24):  # 1 second per shot = 3 seconds total
            writer.write(frame)
    writer.release()

    pipeline = FilmyAIReportPipeline(output_dir=tmp_path)

    # Case 4: Missing script and summary -> Generated from video
    request_data = {
        "title": "Neon Horizon",
        "director": "Christopher Nolan",
        "actors": ["Cillian Murphy", "Robert Downey Jr."],
        "budget": 100000000,
        "genre": "Sci-Fi",
        "video_path": str(video_path),
        "script": None,
        "summary": None,
        "generate_pdf": True
    }

    report = pipeline.generate_report(request_data)

    assert report.film_title == "Neon Horizon"
    assert report.story_provenance["case_mode"] == "CASE_4"
    assert report.story_provenance["script_source"] == "AI_GENERATED"
    assert report.story_provenance["summary_source"] == "AI_GENERATED"
    assert report.raw_video_metrics["status"] == "available"
    assert report.raw_video_metrics["total_shots"] >= 1
    assert Path(report.json_report_path).exists()
    assert Path(report.pdf_report_path).exists()
