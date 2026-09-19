"""
Standalone Pipeline Runner for FILMY AI.
Executes the end-to-end multimodal pipeline with structured stage logging,
precise execution timing, and JSON output for backend integration.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

# Ensure root in path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from LLM_FINAL_REPORT.config import REPORTS_OUTPUT_DIR
from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest
from LLM_FINAL_REPORT.schemas.report_schema import FinalFilmIntelligenceReport
from LLM_FINAL_REPORT.core.script_summary_manager import ScriptSummaryManager
from LLM_FINAL_REPORT.core.evidence_normalizer import EvidenceNormalizer
from LLM_FINAL_REPORT.pdf_generator.report_builder import FilmReportPDFBuilder

try:
    from RAG.rag_pipeline import rag_pipeline
except Exception as _e:
    rag_pipeline = None


def run_pipeline_with_stages(payload: dict) -> dict:
    """
    Executes the multimodal pipeline, emitting structured progress milestones
    and collecting granular stage benchmarks.
    """
    overall_start = time.time()
    timings = {}

    request = FilmInputRequest(**payload)
    output_dir = REPORTS_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    pipeline = FilmyAIReportPipeline(output_dir=output_dir)

    print(f"[STAGE:ANALYZING_VIDEO:15] Initiating ML_VIDEO multimodal analysis...", flush=True)
    video_start = time.time()
    keyframe_out_dir = output_dir / "keyframes" / pipeline._sanitize_filename(request.title)
    video_evidence = pipeline.video_connector.analyze(
        video_path=request.video_path,
        video_url=request.video_url,
        cast_members=request.cast_members,
        keyframe_dir=str(keyframe_out_dir),
        max_duration_sec=request.max_video_duration_sec
    )
    timings["video_analysis_sec"] = round(time.time() - video_start, 2)
    print(f"[TIMING:VIDEO] Finished in {timings['video_analysis_sec']}s (Shots: {video_evidence.total_shots}, Status: {video_evidence.status})", flush=True)

    print(f"[STAGE:ANALYZING_COMMERCIAL:40] Running Commercial Success ML models...", flush=True)
    commercial_start = time.time()
    story_evidence = ScriptSummaryManager.resolve_story_context(
        user_script=request.script,
        user_summary=request.summary,
        video_evidence=video_evidence,
        film_title=request.title,
        genre=request.genre
    )
    commercial_evidence = pipeline.commercial_connector.predict(request.model_dump())
    timings["commercial_ml_sec"] = round(time.time() - commercial_start, 2)
    print(f"[TIMING:COMMERCIAL] Finished in {timings['commercial_ml_sec']}s (Class: {commercial_evidence.predicted_commercial_class})", flush=True)

    print(f"[STAGE:GENERATING_REPORT:65] Synthesizing Studio Report with Groq LLM...", flush=True)
    report_start = time.time()
    normalized_evidence = EvidenceNormalizer.normalize(
        request=request,
        commercial_evidence=commercial_evidence,
        video_evidence=video_evidence,
        story_evidence=story_evidence
    )
    formatted_context = EvidenceNormalizer.format_llm_context(normalized_evidence)
    report = pipeline.groq_analyzer.generate_report(
        evidence=normalized_evidence,
        formatted_context=formatted_context
    )

    # Persist Report JSON and PDF
    timestamp_slug = time.strftime("%Y%m%d_%H%M%S")
    prefix = request.output_filename_prefix or pipeline._sanitize_filename(request.title)
    effective_film_id = request.film_id or prefix
    report.film_id = effective_film_id

    json_path = output_dir / f"{prefix}_{timestamp_slug}_report.json"
    pdf_path = output_dir / f"{prefix}_{timestamp_slug}_report.pdf"

    report.json_report_path = str(json_path)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report.model_dump(), f, indent=2)

    if request.generate_pdf:
        pdf_builder = FilmReportPDFBuilder(output_path=str(pdf_path))
        pdf_builder.build(report)
        report.pdf_report_path = str(pdf_path)

    timings["report_generation_sec"] = round(time.time() - report_start, 2)
    print(f"[TIMING:REPORT] Finished in {timings['report_generation_sec']}s", flush=True)

    print(f"[STAGE:INDEXING_RAG:85] Indexing Multimodal Report into FAISS Knowledge Base...", flush=True)
    rag_start = time.time()
    try:
        if rag_pipeline:
            rag_result = rag_pipeline.ingest_film_report(
                film_id=effective_film_id,
                report_id=report.report_id,
                report=report
            )
            report.rag_indexing_status = rag_result
        else:
            report.rag_indexing_status = {"success": False, "status": "RAG_MODULE_UNAVAILABLE"}
    except Exception as rag_err:
        report.rag_indexing_status = {"success": False, "status": "FAILED", "error": str(rag_err)}
    timings["rag_indexing_sec"] = round(time.time() - rag_start, 2)
    print(f"[TIMING:RAG] Finished in {timings['rag_indexing_sec']}s", flush=True)

    timings["total_execution_sec"] = round(time.time() - overall_start, 2)
    print(f"[TIMING:TOTAL] End-to-End Pipeline Completed in {timings['total_execution_sec']}s", flush=True)

    print(f"[STAGE:COMPLETED:100] Pipeline execution completed successfully.", flush=True)

    report_dict = report.model_dump()
    report_dict["timings"] = timings

    print("[REPORT_JSON_START]", flush=True)
    print(json.dumps(report_dict), flush=True)
    print("[REPORT_JSON_END]", flush=True)

    return report_dict


def main():
    parser = argparse.ArgumentParser(description="FilmyAI Multimodal Pipeline Runner")
    parser.add_argument("--json-input", type=str, help="JSON string or file path containing FilmInputRequest payload")
    parser.add_argument("--film-id", type=str, help="Film ID")
    parser.add_argument("--title", type=str, help="Film title")
    parser.add_argument("--director", type=str, default="Unknown", help="Director name")
    parser.add_argument("--actors", type=str, default="", help="Casting")
    parser.add_argument("--budget", type=float, default=0.0, help="Budget")
    parser.add_argument("--genre", type=str, default="Drama", help="Genre")
    parser.add_argument("--video", type=str, default=None, help="Video path or URL")
    parser.add_argument("--script", type=str, default=None, help="Script text")
    parser.add_argument("--summary", type=str, default=None, help="Summary text")

    args = parser.parse_args()

    if args.json_input:
        input_str = args.json_input.strip()
        if os.path.exists(input_str):
            with open(input_str, "r", encoding="utf-8") as f:
                payload = json.load(f)
        else:
            payload = json.loads(input_str)
    else:
        payload = {
            "film_id": args.film_id,
            "FilmName": args.title,
            "DirectorName": args.director,
            "Casting": args.actors,
            "Budget": args.budget,
            "Genre": args.genre,
            "uploadFilm": args.video,
            "video_path": args.video,
            "Script": args.script,
            "Summary": args.summary,
            "generate_pdf": True
        }

    run_pipeline_with_stages(payload)


if __name__ == "__main__":
    main()
