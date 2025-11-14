import requests
from typing import List, Dict
import os


class BGEService:
    def __init__(self, ollama_base_url: str = None):
        self.ollama_base_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("BGE_MODEL", "bge-large")

    def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using Ollama BGE model"""
        try:
            response = requests.post(
                f"{self.ollama_base_url}/api/embeddings",
                json={
                    "model": self.model_name,
                    "prompt": text
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])
        except Exception as e:
            print(f"Error getting embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1024

    def find_similar_drugs(self, drug_name: str, drug_list: List[Dict], top_k: int = 3) -> List[str]:
        """Find similar drugs using BGE embeddings"""
        try:
            # Get embedding for the query drug
            query_embedding = self.get_embedding(f"medication drug {drug_name}")
            
            # Get embeddings for all drugs and compute similarity
            similarities = []
            for drug in drug_list:
                drug_text = f"medication drug {drug.get('name', '')} {drug.get('category', '')}"
                drug_embedding = self.get_embedding(drug_text)
                
                # Cosine similarity
                similarity = self._cosine_similarity(query_embedding, drug_embedding)
                similarities.append((drug.get('name'), similarity))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return [name for name, _ in similarities[:top_k] if name != drug_name]
        except Exception as e:
            print(f"Error finding similar drugs: {e}")
            return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

