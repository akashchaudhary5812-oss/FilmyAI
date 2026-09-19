import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datasets import load_dataset

from RAG.schemas.chunk_schema import ReportChunk
from RAG.embeddings import EmbeddingEngine
from RAG.vector_store import FAISSVectorStore

# Retrieve token securely from environment or Backend/.env
token = os.getenv("HF_ACCESS_TOKEN") or os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN")
if not token:
    env_path = Path(__file__).resolve().parent.parent / "Backend" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "HF_ACCESS_TOKEN" in line or "HF_TOKEN" in line:
                    parts = line.strip().split("=", 1)
                    if len(parts) == 2:
                        token = parts[1].strip().strip('"').strip("'")
                        break

if token:
    os.environ["HF_TOKEN"] = token

print("=== INGESTING & GROUNDING SHOTQA, CINEPILE, FINEVIDEO ===")

all_new_chunks = []

# 1. CinePile
try:
    print("\n--- Ingesting CinePile Cinema Narrative QA ---")
    ds_cinepile = load_dataset("tomg-group-umd/cinepile", split="test", token=token, streaming=True)
    count = 0
    for r in iter(ds_cinepile):
        movie = r.get("movie_name", "Film Narrative")
        cat = r.get("question_category", "Theme Exploration")
        q = r.get("question", "")
        ans = r.get("answer_key", "")
        scene = str(r.get("movie_scene", ""))[:250]
        
        content = f"Film: {movie} | Category: {cat}\nScene: {scene}\nNarrative Question: {q}\nAnalysis: {ans}"
        chunk = ReportChunk(
            chunk_id=f"cinepile_narrative_{count}",
            film_id="GLOBAL_FILM_INTELLIGENCE_KB",
            film_name="CinePile Cinema Reasoning & Narrative Understanding",
            report_id="CINEPILE_NARRATIVE_KB",
            section="CinePile Narrative & Scene Intelligence",
            subsection=cat,
            source_type="cinepile_research",
            content=content,
            structured_metrics={"movie": movie, "category": cat}
        )
        all_new_chunks.append(chunk)
        count += 1
        if count >= 20:
            break
    print(f"Loaded {count} CinePile chunks.")
except Exception as e:
    print(f"CinePile error: {e}")

# 2. ShotQA
try:
    print("\n--- Ingesting ShotQA Cinematography Vision QA ---")
    ds_shotqa = load_dataset("Vchitect/ShotQA", split="sft", token=token, streaming=True)
    sq_count = 0
    for r in iter(ds_shotqa):
        msgs = r.get("messages", [])
        if len(msgs) >= 2:
            user_msg = msgs[0].get("content", "").replace("<image>", "").strip()
            assistant_msg = msgs[1].get("content", "").strip()
            
            content = f"Cinematography Visual Question:\n{user_msg}\n\nGround Truth Cinematography Analysis:\n{assistant_msg}"
            chunk = ReportChunk(
                chunk_id=f"shotqa_visual_{sq_count}",
                film_id="GLOBAL_FILM_INTELLIGENCE_KB",
                film_name="ShotQA Vision Cinematography Intelligence",
                report_id="SHOTQA_CINEMATOGRAPHY_KB",
                section="ShotQA Cinematography Analysis & Taxonomy",
                subsection="Shot Scale & Camera Movement",
                source_type="shotqa_research",
                content=content,
                structured_metrics={"sample_idx": sq_count}
            )
            all_new_chunks.append(chunk)
            sq_count += 1
            if sq_count >= 20:
                break
    print(f"Loaded {sq_count} ShotQA chunks.")
except Exception as e:
    print(f"ShotQA error: {e}")

# 3. FineVideo
try:
    print("\n--- Ingesting FineVideo Dynamic Scene Understanding ---")
    ds_finevideo = load_dataset("HuggingFaceFV/finevideo", split="train", token=token, streaming=True)
    fv_count = 0
    for r in iter(ds_finevideo):
        json_data = r.get("json", {})
        if isinstance(json_data, str):
            try:
                json_data = json.loads(json_data)
            except:
                json_data = {}
                
        cat = json_data.get("content_fine_category") or "Narrative Scene"
        meta = json_data.get("content_metadata", {})
        chars = meta.get("characterList", [])
        char_desc = "; ".join([f"{c.get('characterId', '')}: {c.get('description', '')}" for c in chars[:2]])
        dyn = str(json_data.get("dynamic_metadata", {}))[:250]
        
        content = f"FineVideo Category: {cat}\nCharacter Dynamics: {char_desc}\nScene Intelligence: {dyn}"
        chunk = ReportChunk(
            chunk_id=f"finevideo_scene_{fv_count}",
            film_id="GLOBAL_FILM_INTELLIGENCE_KB",
            film_name="FineVideo Dynamic Scene & Narrative Intelligence",
            report_id="FINEVIDEO_NARRATIVE_KB",
            section="FineVideo Dynamic Scene Understanding",
            subsection=cat,
            source_type="finevideo_research",
            content=content,
            structured_metrics={"category": cat}
        )
        all_new_chunks.append(chunk)
        fv_count += 1
        if fv_count >= 15:
            break
    print(f"Loaded {fv_count} FineVideo chunks.")
except Exception as e:
    print(f"FineVideo error: {e}")

# 4. Generate Embeddings & Save to FAISS
if all_new_chunks:
    print(f"\nGenerating embeddings for {len(all_new_chunks)} multimodal knowledge chunks...")
    engine = EmbeddingEngine()
    texts = [c.to_formatted_context() for c in all_new_chunks]
    embeddings = engine.embed_documents(texts)

    store = FAISSVectorStore()
    store.save_film_index(
        film_id="GLOBAL_FILM_INTELLIGENCE_KB",
        report_id="MULTIMODAL_RESEARCH_KB",
        chunks=all_new_chunks,
        embeddings=embeddings
    )
    print(f"Successfully indexed {len(all_new_chunks)} multimodal chunks from ShotQA, CinePile, FineVideo into FAISS KB!")
