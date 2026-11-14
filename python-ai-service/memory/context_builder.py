"""
Personalized Context Builder Module
Xây dựng context đầy đủ và cấu trúc phân cấp ưu tiên cho Qwen 2.5 7B:
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
    recommended_products: List[Dict[str, Any]]
) -> str:
    """
    Tạo khối ngữ cảnh cá nhân hóa có cấu trúc chặt chẽ.
    """
    sections = []

    # 1. CURRENT REQUEST
    sections.append(
        "=== 1. CURRENT REQUEST (YÊU CẦU HIỆN TẠI - ƯU TIÊN CAO NHẤT #1) ===\n"
        f"\"{current_request.strip()}\"\n"
        "*(LƯU Ý QUAN TRỌNG: Nếu yêu cầu hiện tại xung đột với sở thích cũ trong quá khứ, BẮT BUỘC ưu tiên yêu cầu hiện tại, không được ép khách hàng dùng lại sở thích cũ!)*"
    )

    # 2. CURRENT CHAT
    if recent_messages:
        chat_lines = []
        for m in recent_messages[-6:]:
            role = "Khách hàng" if m.get("role") == "user" else "AI Tư Vấn"
            chat_lines.append(f"- {role}: {m.get('content', '')}")
        sections.append(
            "=== 2. CURRENT CHAT (HỘI THOẠI TRONG PHIÊN GẦN NHẤT) ===\n" +
            "\n".join(chat_lines)
        )
    else:
        sections.append("=== 2. CURRENT CHAT ===\n(Phiên trò chuyện mới)")

    # 3. USER MEMORY
    if user_memories:
        mem_lines = []
        for m in user_memories[:8]:
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
        sections.append("=== 3. USER MEMORY ===\n(Chưa có ký ức trước đó, đây là người dùng mới hoặc chưa đăng nhập)")

    # 4. USER PREFERENCE SUMMARY
    if preference_summary and preference_summary.get("summary"):
        summary_text = preference_summary.get("summary")
        sections.append(
            f"=== 4. USER PREFERENCE SUMMARY (HỒ SƠ TỔNG HỢP SỞ THÍCH) ===\n"
            f"{summary_text}"
        )
    else:
        sections.append("=== 4. USER PREFERENCE SUMMARY ===\n(Chưa có hồ sơ sở thích tổng hợp)")

    # 5. RECENT BEHAVIOR
    behaviors = []
    if user_interactions.get("search_keywords"):
        behaviors.append(f"Từ khóa vừa tìm kiếm: {', '.join(user_interactions['search_keywords'][:3])}")
    if user_interactions.get("viewed_details"):
        behaviors.append(f"Sản phẩm vừa xem: {', '.join(user_interactions['viewed_details'][:3])}")
    if user_interactions.get("cart_product_ids"):
        behaviors.append(f"Có {len(user_interactions['cart_product_ids'])} sản phẩm trong giỏ hàng")
    
    if behaviors:
        sections.append(
            "=== 5. RECENT BEHAVIOR (HÀNH VI GẦN ĐÂY) ===\n" +
            "\n".join(f"- {b}" for b in behaviors)
        )
    else:
        sections.append("=== 5. RECENT BEHAVIOR ===\n(Không có hành vi xem/tìm kiếm mới)")

    # 6. PURCHASE HISTORY
    if user_interactions.get("purchased_details"):
        sections.append(
            "=== 6. PURCHASE HISTORY (SẢN PHẨM ĐÃ TỪNG MUA) ===\n" +
            "\n".join(f"- Đã mua: {p}" for p in user_interactions["purchased_details"])
        )
    else:
        sections.append("=== 6. PURCHASE HISTORY ===\n(Chưa có lịch sử mua hàng)")

    # 7. RECOMMENDED PRODUCTS (Real data from MySQL)
    product_block = build_product_context_text(recommended_products)
    sections.append(
        "=== 7. RECOMMENDED PRODUCTS (DANH SÁCH SẢN PHẨM THỰC TẾ TRONG HỆ THỐNG) ===\n" +
        product_block
    )

    return "\n\n".join(sections)
