"""
Unit tests for FAISSVectorStore.
Verifies index creation, persistence, disk reloads, and atomic re-indexing.
"""
import shutil
import tempfile
from pathlib import Path
import numpy as np
import pytest

from RAG.vector_store import FAISSVectorStore
from RAG.chunking import ReportChunker
from RAG.embeddings import EmbeddingEngine
from RAG.tests.test_chunking import SAMPLE_REPORT_DICT


@pytest.fixture
def temp_store():
    temp_dir = Path(tempfile.mkdtemp())
    index_dir = temp_dir / "indexes"
    meta_dir = temp_dir / "meta"
    store = FAISSVectorStore(index_dir=index_dir, meta_dir=meta_dir)
    yield store
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_save_and_reload_index(temp_store):
    film_id = "film_matrix_01"
    chunks = ReportChunker.chunk_report(
        film_id=film_id,
        report_id="rep_matrix",
        report_data=SAMPLE_REPORT_DICT
    )
    engine = EmbeddingEngine()
    embeddings = engine.embed_documents([c.to_formatted_context() for c in chunks])

    # Save
    temp_store.save_film_index(film_id, "rep_matrix", chunks, embeddings)
    assert temp_store.is_indexed(film_id)

    # Reload in fresh instance
    fresh_store = FAISSVectorStore(index_dir=temp_store.index_dir, meta_dir=temp_store.meta_dir)
    loaded = fresh_store.load_film_index(film_id)
    assert loaded is not None
    index, reloaded_chunks = loaded
    assert len(reloaded_chunks) == len(chunks)
    assert index.ntotal == len(chunks)


def test_reindexing_prevents_duplicate_vectors(temp_store):
    film_id = "film_repeat_01"
    chunks = ReportChunker.chunk_report(
        film_id=film_id,
        report_id="rep_v1",
        report_data=SAMPLE_REPORT_DICT
    )
    engine = EmbeddingEngine()
    embeddings = engine.embed_documents([c.to_formatted_context() for c in chunks])

    # First index
    temp_store.save_film_index(film_id, "rep_v1", chunks, embeddings)
    loaded1 = temp_store.load_film_index(film_id)
    initial_count = loaded1[0].ntotal

    # Second index (re-run of analysis)
    temp_store.save_film_index(film_id, "rep_v2", chunks, embeddings)
    loaded2 = temp_store.load_film_index(film_id)
    second_count = loaded2[0].ntotal

    # Total vectors must match initial_count, NOT double!
    assert initial_count == len(chunks)
    assert second_count == len(chunks)
