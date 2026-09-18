"""
FastAPI Microservice for FilmyAI Final Report Generation.
Allows Node.js backend or any external client to invoke report generation over REST API.
"""
import sys
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure workspace root in path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from LLM_FINAL_REPORT.config import API_HOST, API_PORT, REPORTS_OUTPUT_DIR
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest
from LLM_FINAL_REPORT.schemas.report_schema import FinalFilmIntelligenceReport
from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline
from ML_VIDEO.src.preprocessing.video_resolver import VideoResolver, VideoResolutionError
from RAG.api import router as rag_router

app = FastAPI(
    title="FILMY AI — Film Intelligence & Report API",
    description="Multimodal Integration, Studio Report Generator, and RAG QA System connecting ML & ML_VIDEO engines.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag_router)

pipeline = FilmyAIReportPipeline()
video_resolver = VideoResolver()


class ValidateUrlRequest(BaseModel):
    url: str = Field(..., description="Public/authorized video URL to probe and validate")


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "FilmyAI LLM Final Report Pipeline",
        "version": "1.0.0"
    }


@app.post("/api/v1/validate-video-url")
def validate_video_url(req: ValidateUrlRequest):
    """
    Validates accessibility, MIME type, and size of a remote video URL.
    Used by frontend for immediate URL verification before submission.
    """
    try:
        video_resolver.validate_url_syntax(req.url)
        probe_info = video_resolver.probe_url(req.url)
        return {
            "valid": True,
            "status": "VIDEO_READY",
            "message": "Video resource is valid and accessible.",
            "content_type": probe_info.get("content_type"),
            "content_length_bytes": probe_info.get("content_length"),
            "extension": probe_info.get("extension"),
        }
    except VideoResolutionError as vre:
        return JSONResponse(
            status_code=400,
            content={
                "valid": False,
                "status": vre.stage,
                "message": vre.message,
                "error_type": vre.__class__.__name__,
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "valid": False,
                "status": "VALIDATING_URL",
                "message": f"Unexpected validation error: {str(e)}",
            }
        )


@app.post("/api/v1/generate-report", response_model=FinalFilmIntelligenceReport)
async def generate_report_endpoint(request: FilmInputRequest):
    """
    Triggers complete multimodal analysis, commercial prediction, Groq LLM synthesis,
    and PDF report generation.
    """
    try:
        report = pipeline.generate_report(request)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


@app.get("/api/v1/reports/pdf/{filename}")
async def download_pdf_report(filename: str):
    """
    Downloads a generated PDF report by filename.
    """
    file_path = REPORTS_OUTPUT_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="PDF report not found")
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename
    )


if __name__ == "__main__":
    print(f"Starting FilmyAI Final Report API on {API_HOST}:{API_PORT}...")
    uvicorn.run("LLM_FINAL_REPORT.api:app", host=API_HOST, port=API_PORT, reload=True)
