"""
Cinematography & Film Intelligence Research Knowledge Ingestion Engine for FilmyAI RAG.
Extracts and indexes academic research papers (CineScale2, MovieBench, ShotBench)
into the persistent film intelligence FAISS knowledge base.
"""
import sys
from pathlib import Path
from typing import List, Dict, Any

import pypdf
from RAG.schemas.chunk_schema import ReportChunk
from RAG.embeddings import EmbeddingEngine
from RAG.vector_store import FAISSVectorStore


def extract_paper_chunks(pdf_path: Path, paper_title: str, doc_id: str) -> List[ReportChunk]:
    if not pdf_path.exists():
        print(f"[ResearchIndexer] Warning: PDF not found: {pdf_path}")
        return []
        
    reader = pypdf.PdfReader(str(pdf_path))
    chunks = []
    
    full_text = ""
    for page_idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue
            
        # Split page into meaningful paragraphs
        paragraphs = [p.strip() for p in page_text.split("\n\n") if len(p.strip()) > 80]
        for p_idx, para in enumerate(paragraphs):
            chunk = ReportChunk(
                chunk_id=f"research_{doc_id}_p{page_idx+1}_c{p_idx+1}",
                film_id="GLOBAL_FILM_INTELLIGENCE_KB",
                film_name="Cinematography & Film Intelligence Research",
                report_id=f"RESEARCH_{doc_id.upper()}",
                section=f"Research: {paper_title}",
                subsection=f"Page {page_idx+1}",
                source_type="research_literature",
                content=f"[{paper_title} - Page {page_idx+1}]\n{para}",
                structured_metrics={"page": page_idx + 1, "doc_id": doc_id}
            )
            chunks.append(chunk)
            
    print(f"[ResearchIndexer] Extracted {len(chunks)} knowledge chunks from {pdf_path.name} ('{paper_title}')")
    return chunks


def index_research_papers(workspace_root: Path = None):
    if workspace_root is None:
        workspace_root = Path(__file__).resolve().parent.parent
        
    gdrive_dir = workspace_root / "scratch" / "gdrive_files"
    
    papers = [
        (gdrive_dir / "gdrive_1.pdf", "CineScale2: A Dataset of Cinematic Camera Features in Movies", "cinescale2"),
        (gdrive_dir / "gdrive_2.pdf", "MovieBench: A Hierarchical Movie Level Dataset for Long Video Generation", "moviebench")
    ]
    
    all_chunks = []
    for path, title, doc_id in papers:
        chunks = extract_paper_chunks(path, title, doc_id)
        all_chunks.extend(chunks)
        
    if not all_chunks:
        print("[ResearchIndexer] No chunks extracted.")
        return
        
    print(f"[ResearchIndexer] Generating embeddings for {len(all_chunks)} research chunks...")
    engine = EmbeddingEngine()
    texts = [c.to_formatted_context() for c in all_chunks]
    embeddings = engine.embed_documents(texts)
    
    store = FAISSVectorStore()
    store.save_film_index(
        film_id="GLOBAL_FILM_INTELLIGENCE_KB",
        report_id="RESEARCH_DOMAIN_KB",
        chunks=all_chunks,
        embeddings=embeddings
    )
    print(f"[ResearchIndexer] Successfully indexed {len(all_chunks)} research chunks into FAISS KB!")


if __name__ == "__main__":
    index_research_papers()
