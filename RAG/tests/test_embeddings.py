"""
Unit tests for RAG EmbeddingEngine.
Verifies vector shape, normalization, and cosine similarity properties.
"""
import numpy as np
import pytest
from RAG.embeddings import EmbeddingEngine


def test_embedding_dimensions_and_normalization():
    engine = EmbeddingEngine()
    texts = [
        "Cinematography analysis of lighting schemes and camera framing.",
        "Commercial box office prediction and revenue catalysts.",
        "Character dialogue and script pacing evaluation."
    ]
    vectors = engine.embed_documents(texts)
    
    assert vectors.shape[0] == 3
    assert vectors.shape[1] == 384
    
    # Check L2 normalization: ||v|| ~ 1.0
    norms = np.linalg.norm(vectors, axis=1)
    for norm in norms:
        assert np.isclose(norm, 1.0, atol=1e-3)


def test_query_similarity_ranking():
    engine = EmbeddingEngine()
    docs = [
        "The lighting in scene 4 uses heavy chiaroscuro and shadow play.",
        "Predicted global box office gross is 500 million dollars.",
        "Screenplay dialogue is witty and well paced."
    ]
    doc_vectors = engine.embed_documents(docs)
    
    # Query for cinematography
    query_vector = engine.embed_query("What lighting techniques were used in the scene?")
    similarities = np.dot(doc_vectors, query_vector.T).flatten()
    
    # The lighting document should have highest similarity
    best_match_idx = int(np.argmax(similarities))
    assert best_match_idx == 0
