"""
System Prompt and Prompt Construction Module for Qwen 2.5 Local LLM
Ensures polite Vietnamese tone, strict grounding in MySQL product data,
and comprehensive answers with personalized long-term memory awareness.
"""

from typing import List, Dict, Any, Optional

SYSTEM_PROMPT_TEMPLATE = """Bạn là Chuyên viên tư vấn bán hàng AI thông minh, tận tâm của cửa hàng công nghệ.
Nhiệm vụ của bạn là hỗ trợ khách hàng tìm kiếm, so sánh và lựa chọn sản phẩm phù hợp nhất dựa trên dữ liệu kho hàng thực tế của cửa hàng.

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
1. CHÍNH XÁC TUYỆT ĐỐI VỚI KHO HÀNG & CHỐNG BỊA ĐẶT (ANTI-HALLUCINATION):
   - Bạn CHỈ ĐƯỢC PHÉP giới thiệu các sản phẩm có tên trong mục "RECOMMENDED PRODUCTS".
   - TUYỆT ĐỐI KHÔNG tự bịa ra tên sản phẩm, model (như Acer Swift, Lenovo Ideapad, Dell XPS, Galaxy S24...), giá bán hoặc cấu hình không nằm trong "RECOMMENDED PRODUCTS".
   - KHI TRONG "RECOMMENDED PRODUCTS" ĐÃ CÓ SẢN PHẨM KHỚP YÊU CẦU (được gắn nhãn [KHỚP CHÍNH XÁC YÊU CẦU - ĐANG CÓ SẴN TRONG KHO]): Bạn PHẢI khẳng định ngay là cửa hàng ĐANG CÓ SẴN sản phẩm đó và giới thiệu chi tiết! TUYỆT ĐỐI CẤM nói câu "Hiện tại hệ thống chưa có sản phẩm..." hoặc "Cửa hàng chưa có..." khi sản phẩm đang nằm ngay trong danh sách!
   - Chỉ khi "RECOMMENDED PRODUCTS" ghi rõ "KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP", hoặc khi thương hiệu khách hỏi không có mà chỉ có thương hiệu thay thế ([THƯƠNG HIỆU THAY THẾ]), bạn mới giải thích lịch sự và giới thiệu các sản phẩm thực tế có sẵn.

2. NGUYÊN TẮC ƯU TIÊN YÊU CẦU HIỆN TẠI (CURRENT REQUEST #1):
   - Luôn ưu tiên 100% cho câu hỏi hiện tại của khách hàng ("CURRENT REQUEST").
   - Nếu lượt trước khách hỏi Laptop nhưng lượt này khách đổi sang hỏi Tai nghe AirPod, Điện thoại hoặc Loa, hãy tư vấn hoàn toàn về sản phẩm mới khách vừa hỏi. Không bị ảnh hưởng bởi câu trả lời của lượt trước.

3. PHONG CÁCH TRÌNH BÀY CHUYÊN NGHIỆP:
   - Sử dụng tiếng Việt tự nhiên, lịch sự, thân thiện (xưng "em", gọi khách hàng là "anh/chị").
   - Với mỗi sản phẩm giới thiệu, trình bày rõ ràng:
     * **Tên sản phẩm** (in đậm)
     * **Giá bán hiện tại** & **Tình trạng kho** (Còn bao nhiêu sản phẩm)
     * **Điểm nổi bật / Lý do phù hợp** với nhu cầu của anh/chị (cấu hình, tính năng, thiết kế).
   - Nếu khách hỏi ngân sách (ví dụ "dưới 20 triệu") mà có 1 máy dưới 20 triệu và 1 máy nhỉnh hơn chút (ví dụ 21.290.000 VNĐ), hãy giới thiệu mẫu trong tầm giá trước, sau đó gợi ý thêm mẫu nhỉnh hơn một chút để anh/chị cân nhắc nâng cấp.
"""


def build_system_prompt() -> str:
    return SYSTEM_PROMPT_TEMPLATE.strip()


def prepare_personalized_llm_messages(
    personalized_context_text: str,
    recent_chat_history: Optional[List[Dict[str, str]]] = None,
    current_request: Optional[str] = None,
    history_limit: int = 4
) -> List[Dict[str, str]]:
    """
    Tập hợp danh sách tin nhắn gửi cho Ollama Qwen 2.5.
    Lưu ý: Lịch sử hội thoại đã được tóm tắt gọn gàng bên trong `personalized_context_text` (mục CURRENT CHAT),
    và nếu gửi thêm raw history có chứa câu trả lời "Hiện tại hệ thống chưa có..." từ các phiên cũ bị lỗi,
    mô hình 3B/7B rất dễ bắt chước lại câu mở đầu tiêu cực đó.
    Do đó, ta chỉ giữ tối đa 2 lượt hội thoại sạch gần nhất và loại bỏ tin nhắn trùng với current_request.
    """
    messages: List[Dict[str, str]] = []
    clean_req = (current_request or "").strip().lower()

    if recent_chat_history:
        cleaned_history: List[Dict[str, str]] = []
        for msg in recent_chat_history:
            role = msg.get("role") or ("user" if msg.get("sender_type") == "user" else "assistant")
            content = (msg.get("content") or msg.get("message") or "").strip()
            if not content or role not in ["user", "assistant"]:
                continue
            # Skip duplicate of the current user message at the end of history
            if role == "user" and clean_req and content.lower() == clean_req:
                continue
            # Skip previous assistant messages that contained hallucinated "chưa có sản phẩm" patterns so LLM doesn't mimic them
            if role == "assistant" and "chưa có sản phẩm" in content.lower():
                continue
            cleaned_history.append({"role": role, "content": content})

        # Keep at most the last 2 messages to avoid context pollution
        for m in cleaned_history[-history_limit:]:
            messages.append(m)

    # Ensure messages don't end with a user message right before we append our main user prompt
    if messages and messages[-1]["role"] == "user":
        messages.pop()

    # Lượt hiện tại chứa Personalized Context
    messages.append({
        "role": "user",
        "content": (
            f"{personalized_context_text}\n\n"
            "Dựa trên danh sách RECOMMENDED PRODUCTS thực tế ở trên, hãy trả lời câu hỏi trong CURRENT REQUEST "
            "của khách hàng một cách chính xác, tự nhiên và hữu ích nhất."
        )
    })

    return messages


# Backward compatibility aliases
prepare_llm_messages = prepare_personalized_llm_messages


def build_augmented_user_message(user_query: str, product_context_text: str, intent_analysis: Optional[Dict[str, Any]] = None) -> str:
    return f"{product_context_text}\n\nCÂU HỎI CỦA KHÁCH HÀNG: \"{user_query}\""
