"""
Configuration module for LLM_FINAL_REPORT.
Automatically discovers environment variables (e.g. GROQ_API_KEY from Backend/.env).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve workspace root (FilmyAI/)
REPORT_MODULE_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = REPORT_MODULE_DIR.parent

# Attempt loading environment variables from potential .env locations
ENV_CANDIDATES = [
    WORKSPACE_ROOT / "RAG" / ".env",
    WORKSPACE_ROOT / "Backend" / ".env",
    WORKSPACE_ROOT / "backend" / ".env",
    WORKSPACE_ROOT / ".env",
    REPORT_MODULE_DIR / ".env"
]

for env_path in ENV_CANDIDATES:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

GROQ_API_KEY = (
    os.getenv("GROQ_LLM_API_KEY", "").strip() or
    os.getenv("GROQ_API_KEY", "").strip()
)
GROQ_DEFAULT_MODEL = os.getenv("GROQ_REPORT_MODEL", "openai/gpt-oss-120b")
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")

# Paths for artifacts and generated reports
REPORTS_OUTPUT_DIR = REPORT_MODULE_DIR / "generated_reports"
REPORTS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TEMP_DIR = REPORT_MODULE_DIR / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# ML and ML_VIDEO directories
ML_DIR = WORKSPACE_ROOT / "ML"
ML_VIDEO_DIR = WORKSPACE_ROOT / "ML_VIDEO"

# Host and Port for the Report Service
API_HOST = os.getenv("REPORT_API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("REPORT_API_PORT", 8000))
