from huggingface_hub import HfApi
api = HfApi()

queries = ["cinematography", "shot", "movie", "film", "video-classification", "cinematic"]
for q in queries:
    res = list(api.list_datasets(search=q, limit=8))
    print(f"Query '{q}': {[d.id for d in res]}")
