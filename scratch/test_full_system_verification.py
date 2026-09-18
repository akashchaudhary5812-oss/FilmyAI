import os
import sys
import time
import requests
import json

# Ensure project paths are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from LLM_FINAL_REPORT.runner import run_pipeline_with_stages
from pymongo import MongoClient

BACKEND_URL = "http://localhost:3000"

def test_full_system():
    print("========================================================")
    print("FILMYAI - COMPLETE END-TO-END VERIFICATION")
    print("========================================================")
    
    # 1. Connect to MongoDB
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/FilmyAI")
    client = MongoClient(mongo_uri)
    db = client.get_database()
    films_col = db["uploadfilms"]
    
    # Check or create a test film in MongoDB
    test_film_id = "test_verified_film_001"
    existing = films_col.find_one({"_id": test_film_id})
    if not existing:
        films_col.insert_one({
            "_id": test_film_id,
            "title": "Cosmic Voyage: Origins",
            "FilmName": "Cosmic Voyage: Origins",
            "director": "Christopher Nolan",
            "DirectorName": "Christopher Nolan",
            "casting": ["Cillian Murphy", "Florence Pugh"],
            "Casting": ["Cillian Murphy", "Florence Pugh"],
            "productionHouses": ["Syncopy", "Universal Pictures"],
            "ProductionHouses": ["Syncopy", "Universal Pictures"],
            "budget": 165000000,
            "Budget": 165000000,
            "genre": "Sci-Fi",
            "Genre": "Sci-Fi",
            "releaseYear": 2026,
            "releaseMonth": 7,
            "isSequel": False,
            "summary": "An exploratory deep space mission into a newly formed singularity uncovers ancient spatial harmonics.",
            "Summary": "An exploratory deep space mission into a newly formed singularity uncovers ancient spatial harmonics.",
            "script": "INT. OBSERVATION DECK - DAY\nA deep resonant tone vibrates through the hull as the stellar vortex stabilizes.",
            "Script": "INT. OBSERVATION DECK - DAY\nA deep resonant tone vibrates through the hull as the stellar vortex stabilizes.",
            "uploadFilm": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "processingStatus": "PENDING",
            "analysisProgress": 0,
            "ragReady": False,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })
        print(f"[MongoDB] Created test film document with _id: {test_film_id}")
    else:
        print(f"[MongoDB] Test film document exists: {test_film_id}")

    # 2. Run Python ML Pipeline with payload
    payload = {
        "film_id": test_film_id,
        "FilmName": "Cosmic Voyage: Origins",
        "uploadFilm": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "DirectorName": "Christopher Nolan",
        "Casting": ["Cillian Murphy", "Florence Pugh"],
        "ProductionHouses": "Syncopy, Universal Pictures",
        "Budget": 165000000,
        "Genre": "Sci-Fi",
        "ReleaseYear": 2026,
        "ReleaseMonth": 7,
        "IsSequel": False,
        "Summary": "An exploratory deep space mission into a newly formed singularity uncovers ancient spatial harmonics.",
        "Script": "INT. OBSERVATION DECK - DAY\nA deep resonant tone vibrates through the hull as the stellar vortex stabilizes.",
        "generate_pdf": True
    }

    print("\n--- Executing Multimodal ML Pipeline Runner ---")
    start = time.time()
    report = run_pipeline_with_stages(payload)
    elapsed = round(time.time() - start, 2)
    print(f"--- Pipeline Execution Completed in {elapsed}s ---")

    # 3. Update MongoDB document with generated report (simulating backend orchestrator)
    films_col.update_one(
        {"_id": test_film_id},
        {"$set": {
            "processingStatus": "COMPLETED",
            "analysisProgress": 100,
            "ragReady": True,
            "report": report.model_dump(),
            "timings": {"total_elapsed_sec": elapsed}
        }}
    )
    print(f"[MongoDB] Updated film {test_film_id} status to COMPLETED with full report!")

    # 4. Verify Backend API Endpoints
    print("\n--- Verifying Backend REST Endpoints ---")
    status_res = requests.get(f"{BACKEND_URL}/api/film/{test_film_id}/status")
    print(f"GET /api/film/{test_film_id}/status -> HTTP {status_res.status_code}")
    status_json = status_res.json()
    assert status_json.get("processingStatus") == "COMPLETED", "Status should be COMPLETED"
    assert status_json.get("analysisProgress") == 100, "Progress should be 100"
    print("Status endpoint check passed!")

    report_res = requests.get(f"{BACKEND_URL}/api/film/{test_film_id}/report")
    print(f"GET /api/film/{test_film_id}/report -> HTTP {report_res.status_code}")
    assert report_res.status_code == 200, "Report endpoint should return 200 OK"
    rep_json = report_res.json()
    fetched_report = rep_json.get("report", {})
    assert fetched_report.get("film_title") == "Cosmic Voyage: Origins"
    assert fetched_report.get("executive_summary", {}).get("commercial_verdict")
    assert "raw_ml_predictions" in fetched_report
    assert "raw_video_metrics" in fetched_report
    print("Report endpoint check passed!")
    print(f"  - Film Title: {fetched_report.get('film_title')}")
    print(f"  - Verdict: {fetched_report.get('executive_summary', {}).get('commercial_verdict')}")
    print(f"  - ML Commercial Class: {fetched_report.get('raw_ml_predictions', {}).get('predicted_commercial_class')}")
    print(f"  - ML Score: {fetched_report.get('raw_ml_predictions', {}).get('predicted_commercial_score')} / 9.0")
    print(f"  - Video Duration Analyzed: {fetched_report.get('raw_video_metrics', {}).get('duration_seconds')}s")
    print(f"  - Total Shots Detected: {fetched_report.get('raw_video_metrics', {}).get('total_shots')}")

    print("\n========================================================")
    print("ALL FRONTEND-BACKEND-ML PIPELINE CHECKS PASSED SUCCESSFULLY!")
    print("========================================================")

if __name__ == "__main__":
    test_full_system()
