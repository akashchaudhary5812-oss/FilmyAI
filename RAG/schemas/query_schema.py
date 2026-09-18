"""
Schemas for FilmyAI RAG Queries, Responses, and Ingestion requests.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    """
    Source citation tracing an answer to a specific report section and chunk.
    """
    section: str = Field(..., description="Report section name")
    subsection: Optional[str] = Field(None, description="Report subsection name")
    relevance_score: float = Field(..., description="Cosine / similarity relevance score")
    chunk_id: Optional[str] = Field(None, description="ID of the retrieved chunk")
    excerpt: Optional[str] = Field(None, description="Short excerpt from source")


class RAGQueryRequest(BaseModel):
    """
    User query request to the film-specific RAG assistant.
    """
    film_id: str = Field(..., description="Target film ID for strict isolation")
    question: str = Field(..., description="User question about the film analysis")
    conversation_id: Optional[str] = Field(None, description="Optional conversation session ID")
    film_name: Optional[str] = Field(None, description="Optional film title for context")
    top_k: Optional[int] = Field(5, description="Number of chunks to retrieve")


class RAGQueryResponse(BaseModel):
    """
    Standard response from the RAG assistant.
    """
    success: bool = Field(True, description="Whether query was successfully processed")
    film_id: str = Field(..., description="Film ID queried")
    conversation_id: Optional[str] = Field(None, description="Conversation session ID")
    question: str = Field(..., description="Original user question")
    answer: str = Field(..., description="Grounded, evidence-based answer from Groq LLM")
    sources: List[SourceCitation] = Field(default_factory=list, description="List of source sections supporting the answer")
    error: Optional[str] = Field(None, description="Error message if success is False")


class RAGIngestRequest(BaseModel):
    """
    Request to manually or programmatically trigger RAG ingestion for a report.
    """
    film_id: str = Field(..., description="Film ID")
    report_id: str = Field(..., description="Report ID")
    report: Dict[str, Any] = Field(..., description="Full structured Final Film Intelligence Report object")


class RAGIndexStatusResponse(BaseModel):
    """
    Status of RAG indexing for a specific film.
    """
    success: bool = Field(True, description="Whether status check succeeded")
    film_id: str = Field(..., description="Film ID checked")
    indexed: bool = Field(False, description="Whether film knowledge base is indexed in FAISS")
    report_id: Optional[str] = Field(None, description="ID of indexed report")
    chunk_count: int = Field(0, description="Total number of indexed chunks")
    indexed_at_utc: Optional[str] = Field(None, description="Timestamp when indexing completed")
    status: str = Field("NOT_INDEXED", description="Status string (INDEXED, INDEXING, FAILED, NOT_INDEXED)")
    error: Optional[str] = Field(None, description="Error details if indexing failed")
