"""
Configuration module for FilmyAI RAG System.
Discovers and loads environment variables from RAG/.env (and fallback candidates),
and configures paths, models, and retrieval parameters.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Directory Paths
RAG_MODULE_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = RAG_MODULE_DIR.parent

# Attempt loading environment variables from candidates
ENV_CANDIDATES = [
    RAG_MODULE_DIR / ".env",
    WORKSPACE_ROOT / "Backend" / ".env",
    WORKSPACE_ROOT / "LLM_FINAL_REPORT" / ".env",
    WORKSPACE_ROOT / ".env"
]

for env_path in ENV_CANDIDATES:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

# Groq API Configuration
# Support both GROQ_LLM_API_KEY (from RAG/.env) and GROQ_API_KEY
GROQ_API_KEY = (
    os.getenv("GROQ_LLM_API_KEY", "").strip() or 
    os.getenv("GROQ_API_KEY", "").strip()
)

# Groq Models - default to high quality supported model on Groq
GROQ_RAG_MODEL = os.getenv("GROQ_RAG_MODEL", "openai/gpt-oss-120b")
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")

# Embedding Configuration
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))

# Retrieval Settings
DEFAULT_TOP_K = int(os.getenv("RAG_DEFAULT_TOP_K", "5"))
SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.20"))

# Persistent Storage Paths
STORAGE_DIR = RAG_MODULE_DIR / "storage"
FAISS_STORAGE_DIR = STORAGE_DIR / "faiss_indexes"
METADATA_STORAGE_DIR = STORAGE_DIR / "metadata"

# Ensure storage directories exist
FAISS_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
METADATA_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
