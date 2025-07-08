from rag_utils.embedding import OpenAIEmbeddings
from rag_utils.vector import QdrantVector
from rag_utils.splitter import Document
from key import OPENAI_API_KEY

# 初始化嵌入與向量儲存元件
embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
vector = QdrantVector(embedding)

# QA 資料
qa_pairs = [
    {"question": "你們有哪些種類的禮贈品可供選擇？", "answer": "您好，Inkslap是專門製作客製化商品的網站，一般商品品類在這裡都找得到，而商品部分目前提供Inkslap選品及品牌商品兩大分類，未來將再增加世界各地的匠人商品系列，敬請期待。"},
    {"question": "請問Inkslap的品牌商品是正版授權的嗎？可以提供證明嗎？", "answer": "您好，inkslap網站上所有的品牌與肖像都為官方正版授權，若您有疑慮請告訴我，我將另外提供您相關證明。"},
    {"question": "如何從禮贈品展現我們品牌的專業感與高質感？", "answer": "您好，針對不同產業及不同贈與對象，選擇適合商品即能加強滿意度及專業感受; 而質感則藏在細節裡，inkslap上架品項皆針對質感做一番篩選，包含材質、設計、成型精緻度，相信您在收到商品時會感受得到。"}
]


# 將 Answer 放進 page_content，Question 當作向量依據
documents = [
    Document(page_content=qa["answer"], metadata={"question": qa["question"]})
    for qa in qa_pairs
]

# Qdrant collection 名稱
collection_name = "inkslap_QA"

# 用其中一個 Question 取得向量維度
embedding_size = len(embedding.embed_query(qa_pairs[0]["question"]))

# 自訂 upsert，把 embedding 改成基於 question
from uuid import uuid4

points = []
for qa in qa_pairs:
    vector_data = embedding.embed_query(qa["question"])
    points.append({
        "id": str(uuid4()),
        "vector": vector_data,
        "payload": {
            "page_content": qa["answer"],
            "question": qa["question"]
        }
    })

# 建立 collection 並上傳
if collection_name not in vector.list_collections():
    vector.create_collection(collection_name, size=embedding_size)

vector.client.upsert(collection_name=collection_name, points=points)

# 查詢
query = "你們有哪些種類的禮贈品可供選擇？"
query_vector = embedding.embed_query(query)

search_result = vector.client.search(
    collection_name=collection_name,
    query_vector=query_vector,
    limit=3,
    with_payload=True
)

# 顯示結果
print(f"\n🔍 查詢: {query}\n")
for result in search_result:
    print(f"✅ 相似度: {result.score:.4f}")
    print(f"❓ 原始問題: {result.payload['question']}")
    print(f"💡 回答: {result.payload['page_content']}")
    print("-" * 40)
