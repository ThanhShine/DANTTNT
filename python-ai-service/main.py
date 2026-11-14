"""
AI Service — FastAPI Main Application
Architecture: Local LLM (Ollama + Qwen 2.5 7B) + MySQL + Personalized AI Memory & Recommendation
Zero OpenAI Dependency | Fully Offline Capable
"""

import os
import sys
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from contextlib import asynccontextmanager

# Windows console encoding fix
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI, HTTPException, Header, Request, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import (
    AI_MODE,
    OLLAMA_URL,
    OLLAMA_MODEL,
    AI_SERVICE_HOST,
    AI_SERVICE_PORT,
    INTERNAL_API_KEY,
)
from database.mysql import query_products, get_user_interactions, check_db_health
from recommendation.recommender import recommend_products
from chatbot.intent import parse_user_intent
from chatbot.product_context import sanitize_product_for_frontend
from chatbot.prompt import build_system_prompt, prepare_personalized_llm_messages
from chatbot.llm_service import llm_service
from chatbot.response import build_final_response
from memory.extractor import extract_memories_from_message
from memory.manager import (
    get_user_memories,
    save_or_update_memory,
    delete_user_memory,
    delete_all_user_memories,
    update_user_memory,
    get_user_preference_summary,
    compile_and_update_preference_summary
)
from memory.context_builder import build_personalized_context


# ── Pydantic Request & Response Schemas ─────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., description="Nội dung câu hỏi của người dùng")
    session_id: Optional[Union[str, int]] = Field(None, description="Mã định danh phiên trò chuyện")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Lịch sử tin nhắn")
    user_id: Optional[int] = Field(None, description="Mã người dùng nếu đã đăng nhập (từ JWT)")


class ChatApiResponse(BaseModel):
    success: bool
    message: str
    products: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    session_id: Optional[str] = None
    intent: Optional[str] = None
    model: Optional[str] = None
    has_memory: bool = False
    error_detail: Optional[str] = None
    is_fallback: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ExtractMemoryRequest(BaseModel):
    user_id: int = Field(..., description="Mã người dùng (từ JWT)")
    message: str = Field(..., description="Câu nói cần trích xuất ký ức")


class UpdateMemoryRequest(BaseModel):
    memory_value: str = Field(..., description="Giá trị mới của ký ức")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Độ tin cậy mới")


# ── App Lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(">>> AI Service Local LLM (Personalized Memory) đang khởi động...")
    print(f"> AI Mode: {AI_MODE}")
    print(f"> Ollama URL: {OLLAMA_URL}")
    print(f"> Target Model: {OLLAMA_MODEL}")
    
    # Check MySQL Health
    db_ok = check_db_health()
    print(f"> MySQL Database: {'[OK] Sẵn sàng' if db_ok.get('status') == 'connected' else '[CẢNH BÁO] Không thể kết nối MySQL'}")
    
    # Check Ollama Health
    ollama_health = await llm_service.check_health()
    if ollama_health["running"]:
        print(f"> Ollama Service: [OK] Đang chạy (Models: {ollama_health['available_models']})")
    else:
        print(f"> Ollama Service: [CẢNH BÁO] Chưa khởi động hoặc không tìm thấy tại {OLLAMA_URL}")
        print("  -> Chạy lệnh: 'ollama run qwen2.5:7b' để khởi động mô hình AI.")
    print("=" * 60)
    yield
    print(">>> AI Service đang tắt...")


app = FastAPI(
    title="Sales AI — Local Qwen 2.5 Chatbot Service with Personalized Memory",
    description="Hệ thống Chatbot AI Local có Bộ nhớ người dùng (Personalized AI Memory), chạy Ollama Qwen 2.5 7B kết hợp MySQL",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper Execution Pipeline ──────────────────────────────────
async def process_chat_query(
    message: str,
    session_id: Optional[Union[str, int]] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main processing pipeline với Personalized Memory:
    1. Parse user intent & extract preferences từ tin nhắn hiện tại
    2. Nếu là user đã đăng nhập (có user_id):
       - Tự động trích xuất các memory mới từ câu nói và lưu/cập nhật vào MySQL
       - Lấy toàn bộ Long-term memory và Preference summary hiện tại
       - Lấy thông tin hành vi & lịch sử mua hàng từ MySQL
    3. Query candidate products từ MySQL
    4. Chạy Personalized Recommendation Scoring (kết hợp yêu cầu hiện tại, memory, hành vi, mua hàng)
    5. Tạo Personalized Context hoàn chỉnh (Current Request, Chat, Memory, Summary, Behavior, Purchases, Products)
    6. Gửi prompt cho Local Ollama Qwen 2.5 7B
    7. Trả kết quả kèm danh thiếp sản phẩm và gắn cờ has_memory
    """
    clean_message = message.strip()
    history = conversation_history or []

    # 1. Intent Analysis
    intent_data = parse_user_intent(clean_message, conversation_history=history)

    # 2. Xử lý Bộ nhớ người dùng (Personalized Memory)
    user_memories = []
    preference_summary = None
    user_interactions = {}
    has_active_memory = False

    if user_id:
        # 2.1 Trích xuất thông tin đáng nhớ từ câu nói hiện tại và lưu vào DB (Mục 5, 6, 15)
        extracted = extract_memories_from_message(clean_message)
        for mem_item in extracted:
            save_or_update_memory(user_id, mem_item)

        # 2.2 Đọc danh sách ký ức dài hạn & hồ sơ sở thích
        user_memories = get_user_memories(user_id)
        preference_summary = get_user_preference_summary(user_id)
        user_interactions = get_user_interactions(user_id)
        has_active_memory = bool(user_memories) or bool(preference_summary)

    # 3. Query Candidates from MySQL
    category_slug = intent_data.get("category")
    # Nếu câu hỏi hiện tại không có category nhưng preference summary có category -> bổ sung gợi ý
    candidates = query_products(category_slug=category_slug, limit=50)

    # 4. Recommendation Scoring với Personalized Memory
    recommended_products = recommend_products(
        candidates=candidates,
        intent_data=intent_data,
        user_memories=user_memories,
        preference_summary=preference_summary,
        user_interactions=user_interactions,
        top_k=4
    )

    # 5. Personalized Context Construction
    personalized_context = build_personalized_context(
        current_request=clean_message,
        recent_messages=history,
        user_memories=user_memories,
        preference_summary=preference_summary,
        user_interactions=user_interactions,
        recommended_products=recommended_products
    )

    system_prompt = build_system_prompt()
    llm_messages = prepare_personalized_llm_messages(
        personalized_context_text=personalized_context,
        recent_chat_history=history
    )

    # 6. Call Local Ollama LLM Service
    llm_output = await llm_service.generate_chat_response(
        system_prompt=system_prompt,
        messages=llm_messages,
        temperature=0.3,
        max_tokens=850
    )

    # 7. Build Final Response (with graceful fallback if Ollama is offline)
    result = build_final_response(
        llm_output=llm_output,
        recommended_products=recommended_products,
        intent_data=intent_data
    )

    result["session_id"] = str(session_id) if session_id else str(uuid.uuid4())
    result["has_memory"] = has_active_memory
    return result


# ── Health Check Endpoints ─────────────────────────────────────
@app.get("/health")
@app.get("/api/ai/health")
async def health():
    db_ok = check_db_health()
    ollama_status = await llm_service.check_health()
    return {
        "status": "ok" if (db_ok.get("status") == "connected" and ollama_status["running"]) else "degraded",
        "service": "AI Chatbot Local (Qwen 2.5 7B) with Personalized Memory",
        "ai_mode": AI_MODE,
        "database_connected": db_ok,
        "ollama": ollama_status,
        "timestamp": datetime.now().isoformat(),
    }


# ── Chat Endpoints ─────────────────────────────────────────────
@app.post("/api/ai/chat", response_model=ChatApiResponse)
async def api_ai_chat(req: ChatRequest):
    """
    Standard Local AI Chat Endpoint với Personalized Memory (Section 7, 10, 13)
    """
    if not req.message or not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tin nhắn không được để trống"
        )

    try:
        response_dict = await process_chat_query(
            message=req.message,
            session_id=req.session_id,
            conversation_history=req.conversation_history,
            user_id=req.user_id
        )
        return ChatApiResponse(**response_dict)
    except Exception as e:
        print(f"[Error in /api/ai/chat]: {e}")
        return ChatApiResponse(
            success=False,
            message="Hệ thống AI đang gặp sự cố khi xử lý dữ liệu. Vui lòng thử lại sau.",
            products=[],
            suggestions=["Xem sản phẩm hot", "Hỏi lại câu khác"],
            session_id=str(req.session_id or ""),
            error_detail=str(e),
            is_fallback=True
        )


@app.post("/chat")
async def legacy_chat_endpoint(req: ChatRequest):
    """Compatible Chat endpoint for existing Node/React integrations"""
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")

    try:
        response_dict = await process_chat_query(
            message=req.message,
            session_id=req.session_id,
            conversation_history=req.conversation_history,
            user_id=req.user_id
        )
        return response_dict
    except Exception as e:
        print(f"[Error in /chat]: {e}")
        return {
            "success": False,
            "session_id": str(req.session_id or ""),
            "message": "Hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.",
            "products": [],
            "suggestions": ["Xem sản phẩm nổi bật", "Tư vấn điện thoại"],
            "intent": "general",
            "is_error": True,
            "error_detail": str(e)
        }


# ── Personalized Memory API Endpoints (Section 13, 14, 18) ─────
@app.get("/api/user/memory")
async def get_memories_endpoint(user_id: int = Query(..., description="ID người dùng từ JWT")):
    """Lấy danh sách các ký ức dài hạn của người dùng."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để xem bộ nhớ AI")
    memories = get_user_memories(user_id)
    return {
        "success": True,
        "user_id": user_id,
        "total": len(memories),
        "data": memories
    }


@app.get("/api/user/preferences")
async def get_preferences_endpoint(user_id: int = Query(..., description="ID người dùng từ JWT")):
    """Lấy hồ sơ tổng hợp sở thích người dùng (user_preference_summary)."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để xem hồ sơ sở thích")
    summary = get_user_preference_summary(user_id)
    return {
        "success": True,
        "user_id": user_id,
        "data": summary
    }


@app.post("/api/user/memory/extract")
async def extract_memory_endpoint(req: ExtractMemoryRequest):
    """Trích xuất và lưu ký ức từ câu nói của người dùng."""
    extracted = extract_memories_from_message(req.message)
    saved_count = 0
    for mem_item in extracted:
        if save_or_update_memory(req.user_id, mem_item):
            saved_count += 1
    return {
        "success": True,
        "user_id": req.user_id,
        "extracted_count": len(extracted),
        "saved_count": saved_count,
        "extracted_memories": extracted
    }


@app.put("/api/user/memory/{memory_id}")
async def update_memory_endpoint(
    memory_id: int,
    req: UpdateMemoryRequest,
    user_id: int = Query(..., description="ID người dùng từ JWT")
):
    """Chỉnh sửa ký ức người dùng (Privacy & Memory Management - Mục 14, 18)."""
    success = update_user_memory(
        user_id=user_id,
        memory_id=memory_id,
        memory_value=req.memory_value,
        confidence=req.confidence
    )
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy ký ức hoặc không có quyền sửa")
    return {"success": True, "message": "Cập nhật ký ức thành công"}


@app.delete("/api/user/memory/{memory_id}")
async def delete_single_memory_endpoint(
    memory_id: int,
    user_id: int = Query(..., description="ID người dùng từ JWT")
):
    """Xóa một ký ức cụ thể của người dùng."""
    success = delete_user_memory(user_id=user_id, memory_id=memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy ký ức hoặc không có quyền xóa")
    return {"success": True, "message": "Xóa ký ức thành công"}


@app.delete("/api/user/memory")
async def delete_all_memories_endpoint(user_id: int = Query(..., description="ID người dùng từ JWT")):
    """Xóa toàn bộ ký ức và hồ sơ sở thích của người dùng."""
    delete_all_user_memories(user_id)
    return {"success": True, "message": "Đã xóa toàn bộ ký ức AI của bạn"}


# ── Global Exception Handler ───────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Global AI Exception]: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "session_id": "",
            "message": "AI local hiện chưa sẵn sàng. Vui lòng kiểm tra lại dịch vụ.",
            "products": [],
            "suggestions": ["Thử lại", "Liên hệ hỗ trợ"],
            "intent": "general",
            "error_detail": str(exc),
            "is_fallback": True,
            "timestamp": datetime.now().isoformat(),
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=AI_SERVICE_HOST,
        port=int(AI_SERVICE_PORT),
        reload=True,
    )
