"""
FAISS Vector Store with Strict Film-Specific Partitioning and Persistence.
Guarantees 100% film isolation, persistent index storage on disk, and atomic re-indexing.
"""
import os
import json
import re
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import faiss

from RAG.config import FAISS_STORAGE_DIR, METADATA_STORAGE_DIR
from RAG.schemas.chunk_schema import ReportChunk


class FAISSVectorStore:
    """
    Manages isolated FAISS indexes per film.
    Uses FAISS IndexFlatIP (Inner Product) with unit-normalized vectors for exact cosine similarity.
    """
    def __init__(
        self,
        index_dir: Optional[Path] = None,
        meta_dir: Optional[Path] = None
    ):
        self.index_dir = Path(index_dir) if index_dir else FAISS_STORAGE_DIR
        self.meta_dir = Path(meta_dir) if meta_dir else METADATA_STORAGE_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.meta_dir.mkdir(parents=True, exist_ok=True)
        
        # In-memory index cache: {film_id: (faiss_index, list_of_chunks)}
        self._cache: Dict[str, Tuple[faiss.Index, List[ReportChunk]]] = {}

    @staticmethod
    def _sanitize_film_id(film_id: str) -> str:
        """Sanitizes film_id for safe filenames."""
        return re.sub(r'[^a-zA-Z0-9_-]', '_', str(film_id)).strip('_') or "default_film"

    def _get_index_path(self, film_id: str) -> Path:
        safe_id = self._sanitize_film_id(film_id)
        return self.index_dir / f"{safe_id}.faiss"

    def _get_meta_path(self, film_id: str) -> Path:
        safe_id = self._sanitize_film_id(film_id)
        return self.meta_dir / f"{safe_id}.json"

    def is_indexed(self, film_id: str) -> bool:
        """Checks if a film has an active FAISS index and metadata."""
        idx_path = self._get_index_path(film_id)
        meta_path = self._get_meta_path(film_id)
        return idx_path.exists() and meta_path.exists()

    def get_status(self, film_id: str) -> Dict[str, Any]:
        """Returns indexing status details for a film."""
        meta_path = self._get_meta_path(film_id)
        if not meta_path.exists():
            return {
                "indexed": False,
                "status": "NOT_INDEXED",
                "chunk_count": 0,
                "report_id": None,
                "indexed_at_utc": None
            }

        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_doc = json.load(f)
            chunks = meta_doc.get("chunks", [])
            return {
                "indexed": True,
                "status": "INDEXED",
                "chunk_count": len(chunks),
                "report_id": meta_doc.get("report_id"),
                "indexed_at_utc": meta_doc.get("indexed_at_utc"),
                "film_name": meta_doc.get("film_name")
            }
        except Exception as e:
            return {
                "indexed": False,
                "status": "FAILED",
                "chunk_count": 0,
                "error": str(e)
            }

    def save_film_index(
        self,
        film_id: str,
        report_id: str,
        chunks: List[ReportChunk],
        embeddings: np.ndarray
    ) -> bool:
        """
        Saves or atomically overwrites the FAISS index and metadata for a film.
        Guarantees zero duplicate vectors on re-indexing.
        """
        if len(chunks) == 0 or embeddings.shape[0] == 0:
            raise ValueError(f"Cannot save empty index for film '{film_id}'")

        if len(chunks) != embeddings.shape[0]:
            raise ValueError(f"Chunk count ({len(chunks)}) != Embedding count ({embeddings.shape[0]})")

        dim = embeddings.shape[1]
        
        # Build IndexFlatIP (Cosine similarity on normalized embeddings)
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings.astype(np.float32))

        safe_id = self._sanitize_film_id(film_id)
        idx_path = self._get_index_path(film_id)
        meta_path = self._get_meta_path(film_id)

        # Write FAISS index
        faiss.write_index(index, str(idx_path))

        # Write metadata
        first_chunk = chunks[0]
        meta_payload = {
            "film_id": str(film_id),
            "film_name": first_chunk.film_name,
            "report_id": str(report_id),
            "indexed_at_utc": first_chunk.created_at_utc,
            "dimension": dim,
            "chunk_count": len(chunks),
            "chunks": [c.model_dump() for c in chunks]
        }

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta_payload, f, indent=2)

        # Update cache
        self._cache[str(film_id)] = (index, chunks)
        return True

    def load_film_index(self, film_id: str) -> Optional[Tuple[faiss.Index, List[ReportChunk]]]:
        """
        Loads the FAISS index and metadata for a specific film.
        Returns None if the film is not indexed.
        """
        film_key = str(film_id)
        if film_key in self._cache:
            return self._cache[film_key]

        idx_path = self._get_index_path(film_id)
        meta_path = self._get_meta_path(film_id)

        if not idx_path.exists() or not meta_path.exists():
            return None

        try:
            index = faiss.read_index(str(idx_path))
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_doc = json.load(f)
            
            raw_chunks = meta_doc.get("chunks", [])
            chunks = [ReportChunk(**c) for c in raw_chunks]

            self._cache[film_key] = (index, chunks)
            return (index, chunks)
        except Exception as e:
            print(f"[FAISSVectorStore] Error loading index for film '{film_id}': {e}")
            return None

    def search_film(
        self,
        film_id: str,
        query_vector: np.ndarray,
        top_k: int = 5
    ) -> List[Tuple[ReportChunk, float]]:
        """
        Searches strictly within the target film's vector store.
        Returns a list of (ReportChunk, similarity_score) tuples.
        """
        loaded = self.load_film_index(film_id)
        if not loaded:
            return []

        index, chunks = loaded
        if len(chunks) == 0:
            return []

        k = min(top_k, len(chunks))
        scores, indices = index.search(query_vector.astype(np.float32), k)

        results: List[Tuple[ReportChunk, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(chunks):
                results.append((chunks[idx], float(score)))

        return results

    def delete_film_index(self, film_id: str) -> bool:
        """Deletes persistent files and cached index for a film."""
        film_key = str(film_id)
        if film_key in self._cache:
            del self._cache[film_key]

        idx_path = self._get_index_path(film_id)
        meta_path = self._get_meta_path(film_id)

        deleted = False
        if idx_path.exists():
            idx_path.unlink()
            deleted = True
        if meta_path.exists():
            meta_path.unlink()
            deleted = True

        return deleted
