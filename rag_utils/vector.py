from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import uuid

class QdrantVector:
    def __init__(self,
                 embedding,
                 host: str="http://ec2-13-112-118-36.ap-northeast-1.compute.amazonaws.com:6333/"):
        self.host = host
        self.embedding = embedding
        self.client = QdrantClient(url=self.host)
        
    def create_collection(self, collection_name: str, size: int):
        if collection_name in self.list_collections():
            raise ValueError(f"Collection '{collection_name}' already exists.")
        
        self.client.create_collection(
            collection_name,
            vectors_config=VectorParams(size=size, distance=Distance.DOT)
        )
    
    def list_collections(self):
        collections = self.client.get_collections()
        collection_names = [collection.name for collection in collections.collections]
        return collection_names
    
    def delete_collection(self, collection_name: str):
        collection_to_delete = collection_name

        collection_names = self.list_collections()

        if collection_to_delete in collection_names:
            self.client.delete_collection(collection_name=collection_to_delete)
            return
        else:
            raise ValueError(f"Collection '{collection_name}' doesn't exist.")
    
    def _build_filter_from_tuples(self, filters: list):
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        if not filters:
            return None

        return Filter(
            must=[
                FieldCondition(
                    key=key,
                    match=MatchValue(value=value)
                ) for key, value in filters
            ]
        )
    
    
    def upsert(self, collection_name: str, docs: list, size: int):
        if collection_name not in self.list_collections():
            self.create_collection(collection_name, size)
            
        qdrant_points = []
        for doc in docs:
            vector = self.embedding.embed_query(doc.page_content)

            # 准备 point 数据
            qdrant_points.append({
                "id": str(uuid.uuid4()),
                "vector": vector,
                "payload": {
                    "page_content": doc.page_content,
                    "source": "blob",
                    "blobType": ""
                }
            })
        self.client.upsert(collection_name=collection_name, points=qdrant_points)
        return
    
    def search_similar(self, collection_name: str, query_text: str, top_k: int = 20, filters: list = None):
        if collection_name not in self.list_collections():
            raise ValueError(f"Collection '{collection_name}' does not exist.")

        query_vector = self.embedding.embed_query(query_text)
        query_filter = self._build_filter_from_tuples(filters)

        search_result = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k,
            with_payload=True,
            with_vectors=False,
            query_filter=query_filter
        )

        return [point.payload.get("page_content", "") for point in search_result]
