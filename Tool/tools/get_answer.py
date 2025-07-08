from Tool import register_tool

@register_tool()
def get_answer(query: str) -> str:
    """
    取得建議的回覆，建議都先來查看這邊的回覆方式。
    """
    from rag_utils.embedding import OpenAIEmbeddings
    from rag_utils.vector import QdrantVector
    from key import OPENAI_API_KEY

    # 初始化元件
    embedding = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    vector = QdrantVector(embedding)

    collection_name = "inkslap_QA"
    query_vector = embedding.embed_query(query)

    search_result = vector.client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=3,
        with_payload=True
    )

    # 組合回答
    if not search_result:
        return "目前無法找到相關的答案，請嘗試其他問題或聯絡客服。"

    response_parts = []
    for result in search_result:
        question = result.payload["question"]
        answer = result.payload["page_content"]
        response_parts.append(f"❓ 問題：{question}\n💡 回答：{answer}")

    return "\n\n".join(response_parts)
