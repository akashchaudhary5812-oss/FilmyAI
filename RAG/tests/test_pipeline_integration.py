"""
Integration test verifying automatic Final Report -> RAG ingestion pipeline.
"""
import pytest
from LLM_FINAL_REPORT.pipeline import FilmyAIReportPipeline
from LLM_FINAL_REPORT.schemas.input_schema import FilmInputRequest
from RAG.rag_pipeline import rag_pipeline


def test_final_report_automatically_triggers_rag_ingestion():
    pipeline = FilmyAIReportPipeline()

    film_req = FilmInputRequest(
        film_id="film_auto_rag_test_99",
        FilmName="Cyberpunk Mirage",
        DirectorName="Denis Villeneuve",
        Casting="Timothee Chalamet, Rebecca Ferguson",
        ProductionHouses="Warner Bros, Legendary",
        Budget=165000000.0,
        Genre="Sci-Fi / Action",
        Summary="In a dystopian desert metropolis, a young navigator discovers ancient cybernetic secrets.",
        generate_pdf=False
    )

    # Generate report
    report = pipeline.generate_report(film_req)

    # 1. Verify Report was generated and validated
    assert report is not None
    assert report.film_title == "Cyberpunk Mirage"
    assert report.executive_summary is not None
    assert report.cinematography_analysis is not None
    assert report.commercial_analysis is not None

    # 2. Verify RAG Indexing status is attached to report
    assert report.rag_indexing_status is not None
    assert report.rag_indexing_status.get("success") is True
    assert report.rag_indexing_status.get("chunk_count", 0) > 0
    assert report.rag_indexing_status.get("status") == "INDEXED"

    # 3. Verify knowledge base is immediately queryable for this film
    status = rag_pipeline.get_index_status("film_auto_rag_test_99")
    assert status.indexed is True
    assert status.chunk_count > 0

    # 4. Query RAG about this film's commercial aspects
    rag_ans = rag_pipeline.query_film(
        film_id="film_auto_rag_test_99",
        question="What is the commercial verdict and target audience for Cyberpunk Mirage?"
    )
    assert rag_ans.success is True
    assert len(rag_ans.sources) > 0
    assert rag_ans.answer is not None and len(rag_ans.answer) > 20
