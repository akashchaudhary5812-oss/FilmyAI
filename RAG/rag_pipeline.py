"""
High-Level Facade for FilmyAI RAG Pipeline.
Provides simple, clean entry points for report ingestion and QA queries.
"""
from typing import Dict, Any, Union, Optional

from RAG.ingestion import RAGIngestionService
from RAG.qa_chain import FilmQAEngine
from RAG.vector_store import FAISSVectorStore
from RAG.schemas.query_schema import RAGQueryResponse, RAGIndexStatusResponse


class FilmyAIRAGPipeline:
    """
    Unified RAG Pipeline for FilmyAI.
    """
    def __init__(self):
        self.vector_store = FAISSVectorStore()
        self.ingestion_service = RAGIngestionService(vector_store=self.vector_store)
        self.qa_engine = FilmQAEngine(retriever=None)

    def ingest_film_report(
        self,
        film_id: str,
        report_id: str,
        report: Union[Dict[str, Any], Any]
    ) -> Dict[str, Any]:
        """
        Automatically ingests a validated Final Film Intelligence Report into FAISS.
        """
        return self.ingestion_service.ingest_report(
            film_id=film_id,
            report_id=report_id,
            report_data=report
        )

    def query_film(
        self,
        film_id: str,
        question: str,
        conversation_id: Optional[str] = None,
        film_name: Optional[str] = None,
        top_k: int = 5
    ) -> RAGQueryResponse:
        """
        Queries the film-specific vector knowledge base and generates a grounded response via Groq.
        """
        return self.qa_engine.ask(
            film_id=film_id,
            question=question,
            conversation_id=conversation_id,
            film_name=film_name,
            top_k=top_k
        )

    def get_index_status(self, film_id: str) -> RAGIndexStatusResponse:
        """
        Retrieves the indexing status and chunk count for a film.
        """
        raw_status = self.vector_store.get_status(film_id)
        return RAGIndexStatusResponse(
            success=True,
            film_id=str(film_id),
            indexed=raw_status.get("indexed", False),
            report_id=raw_status.get("report_id"),
            chunk_count=raw_status.get("chunk_count", 0),
            indexed_at_utc=raw_status.get("indexed_at_utc"),
            status=raw_status.get("status", "NOT_INDEXED"),
            error=raw_status.get("error")
        )


# Global singleton instance for easy import across modules
rag_pipeline = FilmyAIRAGPipeline()
