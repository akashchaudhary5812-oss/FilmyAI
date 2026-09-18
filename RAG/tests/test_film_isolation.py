"""
Tests proving 100% film-specific retrieval isolation.
Guarantees Film A queries NEVER retrieve Film B data.
"""
import copy
import shutil
import tempfile
from pathlib import Path
import pytest

from RAG.vector_store import FAISSVectorStore
from RAG.embeddings import EmbeddingEngine
from RAG.retriever import FilmRetriever
from RAG.ingestion import RAGIngestionService
from RAG.tests.test_chunking import SAMPLE_REPORT_DICT


@pytest.fixture
def isolated_env():
    temp_dir = Path(tempfile.mkdtemp())
    index_dir = temp_dir / "indexes"
    meta_dir = temp_dir / "meta"
    store = FAISSVectorStore(index_dir=index_dir, meta_dir=meta_dir)
    engine = EmbeddingEngine()
    ingestion = RAGIngestionService(vector_store=store, embedding_engine=engine)
    retriever = FilmRetriever(vector_store=store, embedding_engine=engine)
    
    yield {"store": store, "ingestion": ingestion, "retriever": retriever}
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_film_isolation_zero_leakage(isolated_env):
    ingestion = isolated_env["ingestion"]
    retriever = isolated_env["retriever"]

    # Film A: Cyberpunk Film
    film_a_data = copy.deepcopy(SAMPLE_REPORT_DICT)
    film_a_data["film_title"] = "Neon Cyberpunk 2099"
    film_a_data["metadata_summary"]["director"] = "Ridley Cyber"
    film_a_data["commercial_analysis"]["box_office_outlook"] = "Cyberpunk market outlook $200M"
    ingestion.ingest_report("film_A_cyber", "rep_A", film_a_data)

    # Film B: Historical Romance
    film_b_data = copy.deepcopy(SAMPLE_REPORT_DICT)
    film_b_data["film_title"] = "Victorian Romance 1850"
    film_b_data["metadata_summary"]["director"] = "Jane Austen-Director"
    film_b_data["commercial_analysis"]["box_office_outlook"] = "Period drama niche box office $40M"
    ingestion.ingest_report("film_B_romance", "rep_B", film_b_data)

    # 1. Query Film A asking specifically about Victorian Romance
    results_a = retriever.retrieve(
        film_id="film_A_cyber",
        query="Victorian romance period drama 1850 Jane Austen",
        top_k=5
    )
    assert len(results_a) > 0
    for chunk, score in results_a:
        assert chunk.film_id == "film_A_cyber"
        assert chunk.film_name == "Neon Cyberpunk 2099"
        assert "Victorian" not in chunk.content
        assert "Jane Austen" not in chunk.content

    # 2. Query Film B asking specifically about Cyberpunk
    results_b = retriever.retrieve(
        film_id="film_B_romance",
        query="Cyberpunk neon 2099 temporal anomalies",
        top_k=5
    )
    assert len(results_b) > 0
    for chunk, score in results_b:
        assert chunk.film_id == "film_B_romance"
        assert chunk.film_name == "Victorian Romance 1850"
        assert "Cyberpunk" not in chunk.content
        assert "2099" not in chunk.content

    # 3. Query non-existent Film C
    results_c = retriever.retrieve(
        film_id="film_C_nonexistent",
        query="Any film question",
        top_k=5
    )
    assert len(results_c) == 0
