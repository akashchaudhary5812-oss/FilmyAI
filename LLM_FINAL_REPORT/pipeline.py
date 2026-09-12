"""
Unified FilmyAI Report Pipeline.
Orchestrates end-to-end integration: ML_VIDEO -> Script/Summary Priority -> ML Commercial Model -> Groq LLM -> PDF.
"""
import json
import re
import time
from pathlib import Path
from typing import Dict, Any, Union, Optional

from LLM_FINAL_REPORT.config import REPORTS_OUTPUT_DIR
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest
from LLM_FINAL_REPORT.schemas.evidence_schema import NormalizedEvidence
from LLM_FINAL_REPORT.schemas.report_schema import FinalFilmIntelligenceReport
from LLM_FINAL_REPORT.connectors.commercial_model_connector import CommercialModelConnector
from LLM_FINAL_REPORT.connectors.video_engine_connector import VideoEngineConnector
from LLM_FINAL_REPORT.core.script_summary_manager import ScriptSummaryManager
from LLM_FINAL_REPORT.core.evidence_normalizer import EvidenceNormalizer
from LLM_FINAL_REPORT.core.groq_analyzer import GroqFilmAnalyzer
from LLM_FINAL_REPORT.pdf_generator.report_builder import FilmReportPDFBuilder


class FilmyAIReportPipeline:
    """
    Production-grade end-to-end Orchestrator for FILMY AI.
    Executes all 17 integration and reporting steps.
    """
    def __init__(
        self,
        output_dir: Optional[Union[str, Path]] = None,
        groq_api_key: Optional[str] = None
    ):
        self.output_dir = Path(output_dir) if output_dir else REPORTS_OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize connectors and engines
        self.video_connector = VideoEngineConnector()
        self.commercial_connector = CommercialModelConnector()
        self.groq_analyzer = GroqFilmAnalyzer(api_key=groq_api_key)

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        return re.sub(r'[^a-zA-Z0-9_-]', '_', name).strip('_')

    def generate_report(
        self,
        request_input: Union[Dict[str, Any], FilmInputRequest]
    ) -> FinalFilmIntelligenceReport:
        """
        Executes the full 17-step multimodal intelligence pipeline.
        """
        start_time = time.time()
        print("\n========================================================")
        print(" FILMY AI — EXECUTING MULTIMODAL INTELLIGENCE PIPELINE ")
        print("========================================================")

        # ----------------------------------------------------
        # Step 1 & 2: Receive and Validate Film Information & Video Target
        # ----------------------------------------------------
        if isinstance(request_input, dict):
            request = FilmInputRequest(**request_input)
        else:
            request = request_input

        print(f"[Pipeline] Processing Film: '{request.title}' by {request.director}")
        print(f"[Pipeline] Video Target: {request.video_path or request.video_url or 'None provided'}")

        # ----------------------------------------------------
        # Step 3 & 4: Call ML_VIDEO and Receive Multimodal Video Analysis
        # ----------------------------------------------------
        print("[Pipeline] Step 3-4: Invoking ML_VIDEO Multimodal Analysis...")
        keyframe_out_dir = self.output_dir / "keyframes" / self._sanitize_filename(request.title)
        video_evidence = self.video_connector.analyze(
            video_path=request.video_path,
            video_url=request.video_url,
            keyframe_dir=str(keyframe_out_dir),
            max_duration_sec=request.max_video_duration_sec
        )
        print(f"[Pipeline] Video Analysis Status: {video_evidence.status.upper()} (Shots: {video_evidence.total_shots}, Pacing: {video_evidence.pacing_rhythm})")

        # ----------------------------------------------------
        # Step 5, 6, 7: Script / Summary Strict Priority Logic
        # ----------------------------------------------------
        print("[Pipeline] Step 5-7: Resolving Script & Summary Precedence (Cases 1-4)...")
        story_evidence = ScriptSummaryManager.resolve_story_context(
            user_script=request.script,
            user_summary=request.summary,
            video_evidence=video_evidence,
            film_title=request.title,
            genre=request.genre
        )
        print(f"[Pipeline] Story Resolution Mode: {story_evidence.case_mode} | Script: {story_evidence.script_source} | Summary: {story_evidence.summary_source}")

        # ----------------------------------------------------
        # Step 8 & 9: Prepare Input and Call ML Commercial Model
        # ----------------------------------------------------
        print("[Pipeline] Step 8-9: Invoking ML Commercial Prediction Engine...")
        commercial_evidence = self.commercial_connector.predict(request.model_dump())
        print(f"[Pipeline] Commercial Prediction Status: {commercial_evidence.status.upper()} | Class: {commercial_evidence.predicted_commercial_class} | Score: {commercial_evidence.predicted_commercial_score:.2f}/9.0")

        # ----------------------------------------------------
        # Step 10 & 11: Collect, Normalize, and Combine Results
        # ----------------------------------------------------
        print("[Pipeline] Step 10-11: Normalizing Composite Multimodal Evidence...")
        normalized_evidence = EvidenceNormalizer.normalize(
            request=request,
            commercial_evidence=commercial_evidence,
            video_evidence=video_evidence,
            story_evidence=story_evidence
        )
        formatted_context = EvidenceNormalizer.format_llm_context(normalized_evidence)

        # ----------------------------------------------------
        # Step 12, 13, 14: Groq LLM Synthesis and Pydantic Validation
        # ----------------------------------------------------
        print("[Pipeline] Step 12-14: Synthesizing Intelligence with Groq LLM...")
        report = self.groq_analyzer.generate_report(
            evidence=normalized_evidence,
            formatted_context=formatted_context
        )

        # ----------------------------------------------------
        # Step 15 & 16: PDF Generation and Persistence (JSON + PDF)
        # ----------------------------------------------------
        timestamp_slug = time.strftime("%Y%m%d_%H%M%S")
        prefix = request.output_filename_prefix or self._sanitize_filename(request.title)
        
        json_path = self.output_dir / f"{prefix}_{timestamp_slug}_report.json"
        pdf_path = self.output_dir / f"{prefix}_{timestamp_slug}_report.pdf"

        # Save JSON
        report.json_report_path = str(json_path)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report.model_dump(), f, indent=2)
        print(f"[Pipeline] Saved JSON Report: {json_path}")

        # Generate & Save PDF
        if request.generate_pdf:
            print("[Pipeline] Step 15: Rendering Studio-Grade PDF Report...")
            pdf_builder = FilmReportPDFBuilder(output_path=str(pdf_path))
            pdf_builder.build(report)
            report.pdf_report_path = str(pdf_path)
            print(f"[Pipeline] Saved PDF Report: {pdf_path}")

        # ----------------------------------------------------
        # Step 17: Return Final Result
        # ----------------------------------------------------
        elapsed = round(time.time() - start_time, 2)
        print(f"[Pipeline] Step 17: Report Pipeline successfully completed in {elapsed}s!")
        print("========================================================\n")
        return report
