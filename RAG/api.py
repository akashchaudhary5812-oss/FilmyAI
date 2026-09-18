"""
FastAPI Router for FilmyAI RAG API.
Provides endpoints for film-specific QA queries and indexing status checks.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from RAG.rag_pipeline import rag_pipeline, FilmyAIRAGPipeline
from RAG.schemas.query_schema import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGIndexStatusResponse,
    RAGIngestRequest
)

router = APIRouter(prefix="/api/v1/rag", tags=["RAG Film Intelligence"])


@router.post("/query", response_model=RAGQueryResponse)
async def query_film_rag(request: RAGQueryRequest):
    """
    Query the film-specific RAG knowledge base.
    Filters retrieval strictly by film_id and synthesizes a grounded answer via Groq LLM.
    """
    try:
        response = rag_pipeline.query_film(
            film_id=request.film_id,
            question=request.question,
            conversation_id=request.conversation_id,
            film_name=request.film_name,
            top_k=request.top_k or 5
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query execution error: {str(e)}")


@router.get("/status/{film_id}", response_model=RAGIndexStatusResponse)
async def get_film_rag_status(film_id: str):
    """
    Retrieves the RAG indexing status and chunk count for a specific film.
    """
    try:
        status = rag_pipeline.get_index_status(film_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking RAG status: {str(e)}")


@router.post("/ingest")
async def ingest_film_report_endpoint(payload: RAGIngestRequest):
    """
    Programmatically ingests or re-indexes a Final Film Intelligence Report into FAISS.
    """
    try:
        result = rag_pipeline.ingest_film_report(
            film_id=payload.film_id,
            report_id=payload.report_id,
            report=payload.report
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG ingestion error: {str(e)}")
