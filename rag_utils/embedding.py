from openai import OpenAI

class OpenAIEmbeddings:
    def __init__(self, model="text-embedding-3-large", openai_api_key=""):
        self.client = OpenAI(api_key=openai_api_key)
        self.model = model

    def embed_query(self, query):
        response = self.client.embeddings.create(
            input=query,
            model=self.model
        )
        return response.data[0].embedding