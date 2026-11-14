"""
LLM Service - Local Ollama Integration with Qwen 2.5 7B
Connects to Ollama API running locally at http://localhost:11434
Does NOT depend on OpenAI or external cloud APIs.
Includes timeouts, health checks, and graceful error handling.
"""

import httpx
from typing import List, Dict, Any, Optional
from config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT


class LLMService:
    def __init__(self, base_url: str = OLLAMA_URL, model: str = OLLAMA_MODEL, timeout: int = OLLAMA_TIMEOUT):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    async def check_health(self) -> Dict[str, Any]:
        """
        Check if Ollama local server is running and whether the model is pulled.
        Returns:
            {"running": bool, "model_exists": bool, "available_models": list, "message": str}
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    # Model tag may be 'qwen2.5:7b' or 'qwen2.5:7b-instruct' or 'qwen2.5:latest'
                    model_found = any(
                        self.model == m or self.model in m or m.startswith(self.model.split(":")[0])
                        for m in models
                    )
                    return {
                        "running": True,
                        "model_exists": model_found,
                        "available_models": models,
                        "message": "Ollama đang hoạt động." if model_found else f"Model '{self.model}' chưa được tải trong Ollama. Chạy 'ollama pull {self.model}'."
                    }
                return {
                    "running": False,
                    "model_exists": False,
                    "available_models": [],
                    "message": "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."
                }
        except Exception as e:
            return {
                "running": False,
                "model_exists": False,
                "available_models": [],
                "message": "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."
            }

    async def generate_chat_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to the local Ollama instance.
        Formats messages according to Ollama /api/chat schema:
        [
            {"role": "system", "content": "..."},
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
        """
        # First verify health
        health = await self.check_health()
        if not health["running"]:
            return {
                "success": False,
                "error": "OLLAMA_NOT_RUNNING",
                "message": "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."
            }
        
        if not health["model_exists"] and len(health["available_models"]) == 0:
            return {
                "success": False,
                "error": "MODEL_NOT_FOUND",
                "message": f"Model '{self.model}' chưa được tải trong Ollama. Vui lòng chạy lệnh: ollama pull {self.model}"
            }

        # If model specific tag is missing but another qwen/variant exists, use it or fallback to configured model
        actual_model = self.model
        if not health["model_exists"] and health["available_models"]:
            # Fallback to first available local model if desired, or keep configured
            actual_model = health["available_models"][0]

        payload_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant", "system"] and content:
                payload_messages.append({"role": role, "content": content})

        request_body = {
            "model": actual_model,
            "messages": payload_messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                res = await client.post(
                    f"{self.base_url}/api/chat",
                    json=request_body
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("message", {}).get("content", "")
                    return {
                        "success": True,
                        "message": response_text.strip(),
                        "model": actual_model
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Ollama HTTP {res.status_code}",
                        "message": "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "TIMEOUT",
                "message": "Quá trình tạo câu trả lời của AI local bị quá thời gian (timeout). Vui lòng thử lại với câu hỏi ngắn hơn."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."
            }


# Singleton instance for application use
llm_service = LLMService()
