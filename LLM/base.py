# import json
# import time
# from litellm import completion
# from typing import Optional, List, Dict
# from Tool import TOOL_FUNCTIONS

# class BaseLLM:
#     def __init__(self,
#                  provider: str,
#                  model_name: str,
#                  api_key: Optional[str] = None,
#                  api_base: Optional[str] = None,
#                  temperature: float = 0.0,
#                  max_tokens: int = 1500):
#         self.provider = provider
#         self.model_name = model_name
#         self.api_key = api_key
#         self.api_base = api_base
#         self.temperature = temperature
#         self.max_tokens = max_tokens

#     def chat(self,
#              system_prompt: str,
#              user_prompt: str,
#              tools: Optional[List[dict]] = None,
#              history: List[Dict] = [],
#              stream: bool = False):
        
#         messages = [{"role": "system", "content": system_prompt}]
#         if history:
#             messages += history
#         messages.append({"role": "user", "content": user_prompt})

#         kwargs = {
#             "model": self.model_name,
#             "messages": messages,
#             "temperature": self.temperature,
#             "max_tokens": self.max_tokens
#         }
#         if self.api_key:
#             kwargs["api_key"] = self.api_key
#         if self.api_base:
#             kwargs["api_base"] = self.api_base
#         if tools:
#             kwargs["tools"] = tools

#         if not stream:
#             try:
#                 while True:
#                     resp = completion(**kwargs)
#                     msg = resp["choices"][0]["message"]
#                     # print(msg)
#                     if hasattr(msg, "tool_calls") and msg.tool_calls:
#                         for call in msg.tool_calls:
#                             fname = call.function.name
#                             args = json.loads(call.function.arguments)
#                             func = TOOL_FUNCTIONS.get(fname)
#                             result = func(**args) if func else f"[No implementation for {fname}]"

#                             messages.append(msg)
#                             messages.append({
#                                 "role": "tool",
#                                 "tool_call_id": call.id,
#                                 "content": str(result)
#                             })
#                             kwargs["messages"] = messages
#                     else:
#                         return msg.content
#             except Exception as e:
#                 return f"[Error during chat]: {e}"
#         else:
#             def stream_generator():
#                 try:
#                     # tools 模式下暫不支援原生 stream，使用非 stream 模式模擬
#                     if tools:
#                         while True:
#                             resp = completion(**kwargs)
#                             msg = resp["choices"][0]["message"]
#                             if hasattr(msg, "tool_calls") and msg.tool_calls:
#                                 for call in msg.tool_calls:
#                                     fname = call.function.name
#                                     args = json.loads(call.function.arguments)
#                                     func = TOOL_FUNCTIONS.get(fname)
#                                     result = func(**args) if func else f"[No implementation for {fname}]"
#                                     print(f"Tool call: {fname}, args: {args}, result: {str(result)}")
#                                     messages.append(msg)
#                                     messages.append({
#                                         "role": "tool",
#                                         "tool_call_id": call.id,
#                                         "content": str(result)
#                                     })
#                                     kwargs["messages"] = messages
#                             else:
#                                 content = msg.content
#                                 for i in range(0, len(content), 2):
#                                     yield f"data: {content[i:i+2]}\n\n"
#                                     time.sleep(0.03)
#                                 break
#                     else:
#                         kwargs["stream"] = True
#                         for chunk in completion(**kwargs):
#                             delta = chunk["choices"][0]["delta"]
#                             content = delta.get("content", "")
#                             if content:
#                                 yield f"data: {content}\n\n"
#                 except Exception as e:
#                     yield f"data: [Error during streaming]: {e}\n\n"
#                 yield "data: done"

#             return stream_generator()

import json
import time
from litellm import completion
from typing import Optional, List, Dict
from Tool import TOOL_FUNCTIONS

class BaseLLM:
    def __init__(self,
                 provider: str,
                 model_name: str,
                 api_key: Optional[str] = None,
                 api_base: Optional[str] = None,
                 temperature: float = 0.0,
                 max_tokens: int = 1500):
        self.provider = provider
        self.model_name = model_name
        self.api_key = api_key
        self.api_base = api_base
        self.temperature = temperature
        self.max_tokens = max_tokens

    def chat(self,
             system_prompt: str,
             user_prompt: str,
             tools: Optional[List[dict]] = None,
             history: List[Dict] = [],
             stream: bool = False):
        
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages += history
        messages.append({"role": "user", "content": user_prompt})

        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        if self.api_key:
            kwargs["api_key"] = self.api_key
        if self.api_base:
            kwargs["api_base"] = self.api_base
        if tools:
            kwargs["tools"] = tools

        if not stream:
            try:
                while True:
                    resp = completion(**kwargs)
                    msg = resp["choices"][0]["message"]
                    print('message:'+str(msg))
                    
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        # 先添加助手消息（只添加一次）
                        messages.append(msg)
                        
                        # 處理所有工具調用
                        for call in msg.tool_calls:
                            fname = call.function.name
                            args = json.loads(call.function.arguments)
                            func = TOOL_FUNCTIONS.get(fname)
                            result = func(**args) if func else f"[No implementation for {fname}]"
                            print(f"呼叫{str(fname)} ，參數: {str(args)}，\n結果: {str(result)}")

                            # 為每個工具調用添加響應消息
                            messages.append({
                                "role": "tool",
                                "tool_call_id": call.id,
                                "content": str(result)
                            })
                        
                        # 更新消息列表用於下一次調用
                        kwargs["messages"] = messages
                    else:
                        return msg.content
            except Exception as e:
                return f"[Error during chat]: {e}"
        else:
            def stream_generator():
                try:
                    # tools 模式下暫不支援原生 stream，使用非 stream 模式模擬
                    if tools:
                        while True:
                            resp = completion(**kwargs)
                            msg = resp["choices"][0]["message"]
                            
                            if hasattr(msg, "tool_calls") and msg.tool_calls:
                                # 先添加助手消息（只添加一次）
                                messages.append(msg)
                                
                                # 處理所有工具調用
                                for call in msg.tool_calls:
                                    fname = call.function.name
                                    args = json.loads(call.function.arguments)
                                    func = TOOL_FUNCTIONS.get(fname)
                                    result = func(**args) if func else f"[No implementation for {fname}]"
                                    print(f"呼叫{str(fname)} ，參數: {str(args)}，\n結果: {str(result)}")
                                    
                                    # 為每個工具調用添加響應消息
                                    messages.append({
                                        "role": "tool",
                                        "tool_call_id": call.id,
                                        "content": str(result)
                                    })
                                
                                # 更新消息列表用於下一次調用
                                kwargs["messages"] = messages
                            else:
                                content = msg.content
                                for i in range(0, len(content), 2):
                                    yield f"data: {content[i:i+2]}\n\n"
                                    time.sleep(0.03)
                                break
                    else:
                        kwargs["stream"] = True
                        for chunk in completion(**kwargs):
                            delta = chunk["choices"][0]["delta"]
                            content = delta.get("content", "")
                            if content:
                                yield f"data: {content}\n\n"
                except Exception as e:
                    yield f"data: [Error during streaming]: {e}\n\n"
                yield "data: done"

            return stream_generator()