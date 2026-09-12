"""
Command-Line Interface for FilmyAI LLM Report Generator.
Usage:
    python -m LLM_FINAL_REPORT.cli --title "Dangal 2" --director "Nitesh Tiwari" --actors "Aamir Khan, Fatima Sana Shaikh" --budget 70000000 --genre "Drama" --sample
"""
import argparse
import json
import sys
from pathlib import Path

# Ensure root in path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest


def main():
    parser = argparse.ArgumentParser(description="FILMY AI — Film Intelligence & Final Report Generator")
    parser.add_argument("--sample", action="store_true", help="Run with built-in sample blockbuster film payload")
    parser.add_argument("--title", type=str, help="Film title")
    parser.add_argument("--director", type=str, default="Unknown", help="Director name")
    parser.add_argument("--actors", type=str, default="", help="Comma-separated star cast")
    parser.add_argument("--budget", type=float, default=0.0, help="Budget in USD")
    parser.add_argument("--genre", type=str, default="Drama", help="Primary film genre")
    parser.add_argument("--year", type=int, default=2026, help="Release year")
    parser.add_argument("--month", type=int, default=12, help="Release month (1-12)")
    parser.add_argument("--sequel", action="store_true", help="Is a franchise sequel")
    parser.add_argument("--video", type=str, default=None, help="Path or URL to film/trailer video file")
    parser.add_argument("--script", type=str, default=None, help="User screenplay / scene text")
    parser.add_argument("--summary", type=str, default=None, help="User film synopsis")
    parser.add_argument("--output-dir", type=str, default=None, help="Directory to save generated JSON and PDF")
    parser.add_argument("--no-pdf", action="store_true", help="Disable PDF generation")

    args = parser.parse_args()

    if args.sample:
        payload = {
            "FilmName": "Jawan 2: The Return",
            "DirectorName": "Atlee",
            "Casting": "Shah Rukh Khan, Nayanthara, Vijay Sethupathi",
            "ProductionHouses": "Red Chillies Entertainment",
            "Budget": 300000000,
            "Genre": "Action",
            "release_year": 2026,
            "release_month": 10,
            "is_sequel": True,
            "Script": "EXT. METRO VIADUCT - NIGHT. Azad coordinates the tactical breach as torrential rain cascades over Mumbai skyline.",
            "Summary": "A high-octane socio-political action spectacle following a vigilante unit dismantling systemic corruption.",
            "generate_pdf": not args.no_pdf
        }
    else:
        if not args.title:
            parser.print_help()
            sys.exit(1)
            
        payload = {
            "title": args.title,
            "director": args.director,
            "actors": args.actors,
            "budget": args.budget,
            "genre": args.genre,
            "release_year": args.year,
            "release_month": args.month,
            "is_sequel": args.sequel,
            "video_path": args.video,
            "script": args.script,
            "summary": args.summary,
            "generate_pdf": not args.no_pdf
        }

    pipeline = FilmyAIReportPipeline(output_dir=args.output_dir)
    print("\n--- INITIATING FILMY AI PIPELINE RUN ---")
    report = pipeline.generate_report(payload)

    print("\n========================================================")
    print(f" REPORT GENERATED: {report.report_id}")
    print(f" TITLE: {report.film_title}")
    print(f" COMMERCIAL VERDICT: {report.executive_summary.commercial_verdict}")
    print(f" OVERALL RATING: {report.executive_summary.overall_film_rating} / 10.0")
    print(f" SCRIPT PROVENANCE: {report.story_provenance['script_source']}")
    print(f" SUMMARY PROVENANCE: {report.story_provenance['summary_source']}")
    print(f" JSON PATH: {report.json_report_path}")
    print(f" PDF PATH: {report.pdf_report_path}")
    print("========================================================\n")


if __name__ == "__main__":
    main()
