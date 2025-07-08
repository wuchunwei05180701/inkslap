from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import json
import os
from LLM import get_llm
from Tool import TOOL_FUNCTIONS
from Tool.formatter import generate_tool_schema
from key import OPENAI_API_KEY
from prompt import SYSTEM_PROMPT

app = FastAPI()

# # 添加 CORS 中間件
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )



llm = get_llm(
    provider="openai",
    model_name="gpt-4o",
    api_key=OPENAI_API_KEY,
    api_base=None,
    temperature=0.6,
    max_tokens=8000
)

selected = list(TOOL_FUNCTIONS.values())
tool_schemas = generate_tool_schema(selected)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_query: str
    chat_history: List[ChatMessage] = []

class SaveChatRequest(BaseModel):
    chat_history: List[ChatMessage]

@app.post("/chat")
async def chat_stream(payload: ChatRequest):
    user_query = payload.user_query
    chat_history = [msg.dict() for msg in payload.chat_history]
    
    def llm_stream():
        for chunk in llm.chat(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_query,
            tools=tool_schemas,
            history=chat_history,
            stream=True
        ):
            # 添加 SSE 格式前綴
            yield f"data: {chunk}\n\n"
    
    # 更新並保存對話記錄
    updated_history = chat_history + [{"role": "user", "content": user_query}]
    
    return StreamingResponse(llm_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5557)

