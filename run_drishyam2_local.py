"""
FilmyAI Local End-to-End Multimodal Pipeline Runner for Drishyam 2.
Directly executes video analysis, commercial modeling, Groq report generation,
and FAISS RAG indexing, updating MongoDB in real-time.
"""
import os
import sys
import json
import time
from pathlib import Path
from bson import ObjectId
from pymongo import MongoClient

# Configure UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Ensure root directory in sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

# Load environment from Backend/.env
from dotenv import load_dotenv
load_dotenv(WORKSPACE_ROOT / "Backend" / ".env")

from LLM_FINAL_REPORT.runner import run_pipeline_with_stages
from LLM_FINAL_REPORT.config import REPORTS_OUTPUT_DIR

FILM_ID = "6aaf8042e35a27b8abad21dc"

def get_db():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/FilmyAI")
    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    return client, db

def update_status(collection, status: str, progress: int, error: str = None):
    update_fields = {
        "processingStatus": status,
        "analysisProgress": progress,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    if error:
        update_fields["processingError"] = error
    collection.update_one({"_id": ObjectId(FILM_ID)}, {"$set": update_fields})
    print(f"\n[MONGODB STATUS UPDATE] -> {status} ({progress}%)", flush=True)

def main():
    print("=================================================================")
    print(" FILMY AI - LOCAL PIPELINE RUNNER: DRISHYAM 2")
    print("=================================================================")
    
    client, db = get_db()
    collection = db["uploadfilms"]
    
    film_doc = collection.find_one({"_id": ObjectId(FILM_ID)})
    if not film_doc:
        print(f"Error: Film record {FILM_ID} not found in MongoDB!")
        sys.exit(1)
        
    print(f"Loaded Film Document: '{film_doc.get('FilmName')}'")
    print(f"Video Target: {film_doc.get('s3ObjectUrl') or film_doc.get('uploadFilm')}")
    
    # Format cast members
    cast_members = []
    for c in film_doc.get("castMembers", []):
        cast_members.append({
            "actor_name": c.get("actorName"),
            "character_name": c.get("characterName"),
            "image_url": c.get("imageUrl"),
            "image_path": c.get("imageUrl")
        })

    # Prepare payload
    payload = {
        "film_id": FILM_ID,
        "FilmName": film_doc.get("FilmName", "Drishyam 2"),
        "title": film_doc.get("FilmName", "Drishyam 2"),
        "DirectorName": film_doc.get("DirectorName", "Abhishek Pathak"),
        "director": film_doc.get("DirectorName", "Abhishek Pathak"),
        "Casting": film_doc.get("Casting", "Ajay Devgn, Akshaye Khanna, Tabu"),
        "actors": film_doc.get("Casting", "Ajay Devgn, Akshaye Khanna, Tabu"),
        "cast_members": cast_members,
        "ProductionHouses": film_doc.get("ProductionHouses", "Panorama Studios, T-Series"),
        "Budget": 500000000,
        "budget": 500000000,
        "Genre": film_doc.get("Genre", "Drama / Crime / Thriller"),
        "genre": film_doc.get("Genre", "Drama / Crime / Thriller"),
        "uploadFilm": film_doc.get("s3ObjectUrl") or film_doc.get("uploadFilm"),
        "video_path": film_doc.get("s3ObjectUrl") or film_doc.get("uploadFilm"),
        "video_url": film_doc.get("s3ObjectUrl") or film_doc.get("uploadFilm"),
        "Script": film_doc.get("Script", ""),
        "script": film_doc.get("Script", ""),
        "Summary": film_doc.get("Summary", ""),
        "summary": film_doc.get("Summary", ""),
        "is_sequel": True,
        "generate_pdf": True
    }

    try:
        update_status(collection, "ANALYZING_VIDEO", 15)
        
        # Execute pipeline
        report_dict = run_pipeline_with_stages(payload)
        
        # Extract model rating and timings
        model_rating = (
            report_dict.get("executive_summary", {}).get("overall_film_rating") or
            report_dict.get("raw_ml_predictions", {}).get("predicted_commercial_score") or
            8.5
        )
        timings = report_dict.get("timings", {})
        
        # Final MongoDB Update
        collection.update_one(
            {"_id": ObjectId(FILM_ID)},
            {
                "$set": {
                    "processingStatus": "COMPLETED",
                    "analysisProgress": 100,
                    "ragReady": True,
                    "report": report_dict,
                    "rating": round(float(model_rating), 1),
                    "timings": timings,
                    "processingError": None,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                }
            }
        )
        update_status(collection, "COMPLETED", 100)
        
        print("\n=================================================================")
        print(f" SUCCESS: Drishyam 2 analysis finished & synced to MongoDB!")
        print(f" Overall Rating : {model_rating}/10")
        print(f" Commercial Class : {report_dict.get('raw_ml_predictions', {}).get('predicted_commercial_class')}")
        print("=================================================================")
        
    except Exception as e:
        print(f"\n[ERROR] Pipeline failed: {e}", flush=True)
        import traceback
        traceback.print_exc()
        update_status(collection, "FAILED", 0, error=str(e))
    finally:
        client.close()

if __name__ == "__main__":
    main()
