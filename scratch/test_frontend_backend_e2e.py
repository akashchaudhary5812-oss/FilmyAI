import requests
import json
import time

BACKEND_URL = "http://localhost:3000"

def test_backend_film_endpoints():
    print("=== Testing Backend Film Status & Report Endpoints ===")
    
    # 1. Fetch existing movies from backend
    try:
        res = requests.get(f"{BACKEND_URL}/api/All_movies", timeout=5)
        print(f"GET /api/All_movies -> HTTP {res.status_code}")
        movies_data = res.json()
        movies = movies_data.get("movies", [])
        print(f"Found {len(movies)} movies in DB")
        
        if movies:
            target_movie = movies[0]
            movie_id = target_movie.get("_id")
            print(f"Testing with Movie ID: {movie_id} ('{target_movie.get('title')}')")
            
            # Test status endpoint
            status_res = requests.get(f"{BACKEND_URL}/api/film/{movie_id}/status", timeout=5)
            print(f"GET /api/film/{movie_id}/status -> HTTP {status_res.status_code}")
            print(f"Status Payload: {json.dumps(status_res.json(), indent=2)}")
            
            # Test report endpoint
            report_res = requests.get(f"{BACKEND_URL}/api/film/{movie_id}/report", timeout=5)
            print(f"GET /api/film/{movie_id}/report -> HTTP {report_res.status_code}")
            if report_res.status_code == 200:
                report_data = report_res.json()
                print("Report successfully retrieved from MongoDB!")
                print(f"Report ID: {report_data.get('report', {}).get('report_id')}")
                print(f"Verdict: {report_data.get('report', {}).get('executive_summary', {}).get('commercial_verdict')}")
            else:
                print(f"Report not yet generated or status response: {report_res.text}")
    except Exception as e:
        print(f"Error querying backend: {e}")

if __name__ == "__main__":
    test_backend_film_endpoints()
