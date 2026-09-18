"""
Film-Specific Vector Retriever for FilmyAI RAG.
Filters queries strictly by film_id before returning context.
"""
from typing import List, Tuple, Optional
import numpy as np

from RAG.config import DEFAULT_TOP_K, SIMILARITY_THRESHOLD
from RAG.embeddings import EmbeddingEngine
from RAG.vector_store import FAISSVectorStore
from RAG.schemas.chunk_schema import ReportChunk
from RAG.schemas.query_schema import SourceCitation


class FilmRetriever:
    """
    Retriever that enforces 100% film_id isolation.
    Queries only the FAISS vector space associated with the specified film_id.
    """
    def __init__(
        self,
        vector_store: Optional[FAISSVectorStore] = None,
        embedding_engine: Optional[EmbeddingEngine] = None
    ):
        self.vector_store = vector_store or FAISSVectorStore()
        self.embedding_engine = embedding_engine or EmbeddingEngine()

    def retrieve(
        self,
        film_id: str,
        query: str,
        top_k: int = DEFAULT_TOP_K
    ) -> List[Tuple[ReportChunk, float]]:
        """
        Embeds the search query and retrieves the most relevant chunks strictly for the given film_id.
        Returns: List of (ReportChunk, similarity_score).
        """
        if not film_id or not query.strip():
            return []

        # Generate query embedding
        query_vector = self.embedding_engine.embed_query(query)

        # Search target film's isolated FAISS index
        results = self.vector_store.search_film(
            film_id=film_id,
            query_vector=query_vector,
            top_k=top_k
        )

        return results

    def format_sources(self, retrieved: List[Tuple[ReportChunk, float]]) -> List[SourceCitation]:
        """
        Converts retrieved chunks into traceable SourceCitation objects.
        """
        citations: List[SourceCitation] = []
        for chunk, score in retrieved:
            # Short excerpt (first 120 chars)
            excerpt = chunk.content[:120].strip() + ("..." if len(chunk.content) > 120 else "")
            citations.append(
                SourceCitation(
                    section=chunk.section,
                    subsection=chunk.subsection,
                    relevance_score=round(float(score), 4),
                    chunk_id=chunk.chunk_id,
                    excerpt=excerpt
                )
            )
        return citations

    def assemble_context(self, retrieved: List[Tuple[ReportChunk, float]]) -> str:
        """
        Formats retrieved chunks into a clean, structured context string for Groq LLM.
        """
        if not retrieved:
            return "No relevant analysis sections retrieved for this film."

        sections_text = []
        for i, (chunk, score) in enumerate(retrieved, start=1):
            sections_text.append(
                f"--- SOURCE {i} [{chunk.section} > {chunk.subsection or 'General'}] (Relevance: {score:.2f}) ---\n"
                f"{chunk.content}\n"
            )
        return "\n".join(sections_text)
