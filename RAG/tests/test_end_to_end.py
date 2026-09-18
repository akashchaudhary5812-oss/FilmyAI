"""
End-to-End Acceptance Test for FilmyAI RAG & Final Report System.
"""
import pytest
from fastapi.testclient import TestClient

from LLM_FINAL_REPORT.api import app
from RAG.rag_pipeline import rag_pipeline


@pytest.fixture
def api_client():
    return TestClient(app)


def test_end_to_end_complete_workflow(api_client):
    film_id = "film_e2e_odyssey_100"
    
    # ---------------------------------------------------------
    # STEP 1: Generate Report via REST API
    # ---------------------------------------------------------
    request_payload = {
        "film_id": film_id,
        "FilmName": "Odyssey Beyond The Stars",
        "DirectorName": "Stanley Kubrick",
        "Casting": "Keir Dullea, Gary Lockwood",
        "ProductionHouses": "Metro-Goldwyn-Mayer",
        "Budget": 12000000.0,
        "Genre": "Sci-Fi / Epic",
        "Summary": "Humanity finds a mysterious, obviously artificial object buried beneath the lunar surface and sets off on a quest.",
        "generate_pdf": False
    }

    report_response = api_client.post("/api/v1/generate-report", json=request_payload)
    assert report_response.status_code == 200
    report_data = report_response.json()
    assert report_data["film_title"] == "Odyssey Beyond The Stars"
    
    # Verify RAG status returned in report payload
    rag_status = report_data.get("rag_indexing_status", {})
    assert rag_status.get("success") is True
    assert rag_status.get("status") == "INDEXED"

    # ---------------------------------------------------------
    # STEP 2: Check RAG Index Status via REST API
    # ---------------------------------------------------------
    status_response = api_client.get(f"/api/v1/rag/status/{film_id}")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["success"] is True
    assert status_data["indexed"] is True
    assert status_data["chunk_count"] > 0

    # ---------------------------------------------------------
    # STEP 3: Ask Primary Question via RAG Query API
    # ---------------------------------------------------------
    query_payload = {
        "film_id": film_id,
        "question": "Why was this film evaluated at this commercial level?",
        "conversation_id": "e2e_conv_01"
    }
    query_response = api_client.post("/api/v1/rag/query", json=query_payload)
    assert query_response.status_code == 200
    q_data = query_response.json()
    assert q_data["success"] is True
    assert q_data["film_id"] == film_id
    assert len(q_data["answer"]) > 20
    assert len(q_data["sources"]) > 0

    # ---------------------------------------------------------
    # STEP 4: Ask Conversational Follow-Up Question
    # ---------------------------------------------------------
    follow_up_payload = {
        "film_id": film_id,
        "question": "What cinematography strengths were identified?",
        "conversation_id": "e2e_conv_01"
    }
    follow_up_response = api_client.post("/api/v1/rag/query", json=follow_up_payload)
    assert follow_up_response.status_code == 200
    f_data = follow_up_response.json()
    assert f_data["success"] is True
    assert len(f_data["answer"]) > 20
    source_sections = [s["section"] for s in f_data["sources"]]
    assert "Cinematography" in source_sections or "Creative Assessment" in source_sections
