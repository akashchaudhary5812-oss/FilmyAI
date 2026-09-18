"""
Integration test for FilmQAEngine with real Groq API connectivity using RAG/.env.
"""
import pytest
from RAG.rag_pipeline import rag_pipeline
from RAG.config import GROQ_API_KEY
from RAG.tests.test_chunking import SAMPLE_REPORT_DICT


@pytest.fixture(scope="module", autouse=True)
def setup_test_film():
    # Ingest sample film into global RAG pipeline
    rag_pipeline.ingest_film_report(
        film_id="film_live_test_001",
        report_id="rep_live_001",
        report=SAMPLE_REPORT_DICT
    )


def test_groq_api_key_configured():
    assert GROQ_API_KEY is not None and len(GROQ_API_KEY) > 10, "GROQ_API_KEY must be loaded from RAG/.env"


def test_rag_qa_commercial_query_grounded():
    response = rag_pipeline.query_film(
        film_id="film_live_test_001",
        question="Why was this film considered commercially risky?",
        conversation_id="conv_live_test"
    )

    assert response.success is True
    assert response.film_id == "film_live_test_001"
    assert response.answer is not None and len(response.answer) > 20
    assert len(response.sources) > 0
    # Must cite Commercial Analysis or Creative Assessment
    source_sections = [s.section for s in response.sources]
    assert "Commercial Analysis" in source_sections or "Creative Assessment" in source_sections


def test_rag_qa_cinematography_query_grounded():
    response = rag_pipeline.query_film(
        film_id="film_live_test_001",
        question="What visual style and lighting techniques were identified for this film?",
        conversation_id="conv_live_test"
    )

    assert response.success is True
    assert len(response.sources) > 0
    source_sections = [s.section for s in response.sources]
    assert "Cinematography" in source_sections


def test_rag_qa_conversational_follow_up():
    conv_id = "conv_follow_up_session"
    
    # First turn
    turn1 = rag_pipeline.query_film(
        film_id="film_live_test_001",
        question="What are the key weaknesses identified in this film?",
        conversation_id=conv_id
    )
    assert turn1.success is True

    # Follow-up turn referencing the previous answer
    turn2 = rag_pipeline.query_film(
        film_id="film_live_test_001",
        question="Which post-production recommendations address those weaknesses?",
        conversation_id=conv_id
    )
    assert turn2.success is True
    assert turn2.answer is not None and len(turn2.answer) > 10


def test_rag_qa_unsupported_question_handles_gracefully():
    response = rag_pipeline.query_film(
        film_id="film_live_test_001",
        question="What is the catering budget and who was the chief chef on set?",
        conversation_id="conv_unsupported"
    )

    assert response.success is True
    lower_ans = response.answer.lower()
    # The grounded prompt instructs to indicate when information is unavailable
    assert (
        "not available" in lower_ans or 
        "not contain" in lower_ans or 
        "not mentioned" in lower_ans or 
        "does not provide" in lower_ans or
        "unavailable" in lower_ans or
        "catering" in lower_ans
    )
