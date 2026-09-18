"""
RAG Ingestion Service for FilmyAI.
Coordinates Report Extraction -> Chunking -> Embedding -> FAISS Storage.
"""
from typing import Dict, Any, Union, Optional
import time

from RAG.chunking import ReportChunker
from RAG.embeddings import EmbeddingEngine
from RAG.vector_store import FAISSVectorStore


class RAGIngestionService:
    """
    Ingests validated FilmyAI Final Reports into the film-isolated vector knowledge base.
    """
    def __init__(
        self,
        vector_store: Optional[FAISSVectorStore] = None,
        embedding_engine: Optional[EmbeddingEngine] = None
    ):
        self.vector_store = vector_store or FAISSVectorStore()
        self.embedding_engine = embedding_engine or EmbeddingEngine()

    def ingest_report(
        self,
        film_id: str,
        report_id: str,
        report_data: Union[Dict[str, Any], Any]
    ) -> Dict[str, Any]:
        """
        Extracts, chunks, embeds, and indexes a Final Film Intelligence Report.
        Safe against partial failures.
        """
        start_time = time.time()
        film_id_str = str(film_id).strip()
        report_id_str = str(report_id).strip()

        print(f"\n[RAG] Ingestion started for Film ID: '{film_id_str}' (Report: '{report_id_str}')")

        try:
            # 1. Chunking
            chunks = ReportChunker.chunk_report(
                film_id=film_id_str,
                report_id=report_id_str,
                report_data=report_data
            )
            sections_extracted = len(set(c.section for c in chunks))
            print(f"[RAG] Sections extracted: {sections_extracted}")
            print(f"[RAG] Chunks created: {len(chunks)}")

            if not chunks:
                return {
                    "success": False,
                    "film_id": film_id_str,
                    "report_id": report_id_str,
                    "status": "FAILED",
                    "chunk_count": 0,
                    "error": "No chunks could be extracted from report"
                }

            # 2. Embedding Generation
            chunk_texts = [c.to_formatted_context() for c in chunks]
            embeddings = self.embedding_engine.embed_documents(chunk_texts)
            print(f"[RAG] Embeddings generated (shape: {embeddings.shape})")

            # 3. FAISS Index Storage
            self.vector_store.save_film_index(
                film_id=film_id_str,
                report_id=report_id_str,
                chunks=chunks,
                embeddings=embeddings
            )
            print(f"[RAG] FAISS index updated")
            print(f"[RAG] Film index ready")

            elapsed = round(time.time() - start_time, 2)
            return {
                "success": True,
                "film_id": film_id_str,
                "report_id": report_id_str,
                "status": "INDEXED",
                "chunk_count": len(chunks),
                "sections_count": sections_extracted,
                "elapsed_sec": elapsed
            }

        except Exception as e:
            print(f"[RAG] Ingestion failed for Film ID '{film_id_str}': {e}")
            return {
                "success": False,
                "film_id": film_id_str,
                "report_id": report_id_str,
                "status": "FAILED",
                "chunk_count": 0,
                "error": str(e)
            }
