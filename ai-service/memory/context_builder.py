"""
Personalized Context Builder Module
Xây dựng context đầy đủ và cấu trúc phân cấp ưu tiên cho Qwen 2.5:
1. CURRENT REQUEST (Yêu cầu hiện tại của người dùng - Ưu tiên cao nhất #1)
2. CURRENT CHAT (Ngữ cảnh hội thoại gần nhất trong phiên - Ưu tiên #2)
3. USER MEMORY (Ký ức dài hạn của người dùng - Ưu tiên #3)
4. USER PREFERENCE SUMMARY (Hồ sơ tổng hợp sở thích)
5. RECENT BEHAVIOR (Hành vi tìm kiếm & xem sản phẩm gần đây)
6. PURCHASE HISTORY (Lịch sử đã mua hàng)
7. RECOMMENDED PRODUCTS (Danh sách sản phẩm thật từ MySQL)
"""

from typing import List, Dict, Any, Optional
from chatbot.product_context import build_product_context_text


def build_personalized_context(
    current_request: str,
    recent_messages: List[Dict[str, str]],
    user_memories: List[Dict[str, Any]],
    preference_summary: Optional[Dict[str, Any]],
    user_interactions: Dict[str, Any],
    recommended_products: List[Dict[str, Any]],
    intent_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Tạo khối ngữ cảnh cá nhân hóa có cấu trúc chặt chẽ.
    """
    sections = []
    clean_req = current_request.strip()

    # 1. CURRENT REQUEST
    sections.append(
        "=== 1. CURRENT REQUEST (YÊU CẦU HIỆN TẠI CỦA KHÁCH HÀNG - ƯU TIÊN CAO NHẤT #1) ===\n"
        f"\"{clean_req}\"\n"
        "*(LƯU Ý QUAN TRỌNG: Bắt buộc trả lời đúng trọng tâm câu hỏi hiện tại này. Không lấy câu trả lời cũ của lượt trước để áp đặt cho lượt này!)*"
    )

    # 2. CURRENT CHAT (Loại bỏ tin nhắn cuối nếu bị trùng với current_request)
    filtered_history = []
    if recent_messages:
        for m in recent_messages:
            content = (m.get("content") or m.get("message") or "").strip()
            if content and content.lower() != clean_req.lower():
                filtered_history.append(m)

    if filtered_history:
        chat_lines = []
        for m in filtered_history[-4:]:
            role = "Khách hàng" if (m.get("role") == "user" or m.get("sender_type") == "user") else "AI Tư Vấn"
            content = (m.get("content") or m.get("message") or "").strip()
            if len(content) > 220:
                content = content[:220] + "..."
            chat_lines.append(f"- {role}: {content}")
        sections.append(
            "=== 2. CURRENT CHAT (LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ) ===\n" +
            "\n".join(chat_lines)
        )
    else:
        sections.append("=== 2. CURRENT CHAT ===\n(Câu hỏi mới độc lập)")

    # 3. USER MEMORY
    if user_memories:
        mem_lines = []
        for m in user_memories[:6]:
            m_type = m.get("memory_type", "")
            m_key = m.get("memory_key", "")
            m_val = m.get("memory_value", "")
            conf = float(m.get("confidence", 0.5))
            mem_lines.append(f"- [{m_type.upper()}] {m_key}: {m_val} (độ tin cậy: {conf:.1f})")
        sections.append(
            "=== 3. USER MEMORY (KÝ ỨC DÀI HẠN QUA CÁC PHIÊN TRƯỚC) ===\n" +
            "\n".join(mem_lines)
        )
    else:
        sections.append("=== 3. USER MEMORY ===\n(Chưa có ký ức trước đó)")

    # 4. USER PREFERENCE SUMMARY
    if preference_summary and preference_summary.get("summary"):
        summary_text = preference_summary.get("summary")
        sections.append(
            f"=== 4. USER PREFERENCE SUMMARY (HỒ SƠ TỔNG HỢP SỞ THÍCH) ===\n"
            f"{summary_text}"
        )

    # 5. RECENT BEHAVIOR & PURCHASE HISTORY
    behaviors = []
    if user_interactions.get("search_keywords"):
        behaviors.append(f"Từ khóa vừa tìm kiếm: {', '.join(user_interactions['search_keywords'][:3])}")
    if user_interactions.get("viewed_details"):
        behaviors.append(f"Sản phẩm vừa xem: {', '.join(user_interactions['viewed_details'][:3])}")
    if user_interactions.get("purchased_details"):
        behaviors.append(f"Đã từng mua: {', '.join(user_interactions['purchased_details'][:3])}")

    if behaviors:
        sections.append(
            "=== 5. USER BEHAVIOR & PURCHASES ===\n" +
            "\n".join(f"- {b}" for b in behaviors)
        )

    # 6. RECOMMENDED PRODUCTS (Real data from MySQL)
    product_block = build_product_context_text(recommended_products, intent_data=intent_data)
    sections.append(
        "=== 6. RECOMMENDED PRODUCTS (DANH SÁCH SẢN PHẨM THỰC TẾ TRONG KHO CỬA HÀNG) ===\n" +
        product_block
    )

    return "\n\n".join(sections)
