from LLM import get_llm
from Tool import TOOL_FUNCTIONS, register_tool
from Tool.formatter import generate_tool_schema
from key import OPENAI_API_KEY
from prompt import SYSTEM_PROMPT


llm = get_llm(
            provider="openai",
            model_name="gpt-4.1",
            api_key=OPENAI_API_KEY,
            api_base=None,
            temperature=0.6,
            max_tokens=8000
        )

selected = list(TOOL_FUNCTIONS.values())
tool_schemas = generate_tool_schema(selected)

chat_history = []
while True:
    user_query = input("請詢問: ")
    ans = llm.chat(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_query,
                tools=tool_schemas,
                history=chat_history,
                stream=False
            )

    print(ans)
    chat_history.append({"role": "user", "content": user_query})
    chat_history.append({"role": "assistant", "content": ans})