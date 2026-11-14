"""
Response Formatting and Fallback Handling Module
Ensures clean outputs, product card attachments, suggestion chips,
and graceful offline fallbacks when Ollama is not active.
"""

from typing import List, Dict, Any, Optional
from chatbot.product_context import sanitize_product_for_frontend, format_currency_vnd


def format_offline_fallback(products: List[Dict[str, Any]], intent_data: Dict[str, Any]) -> str:
    """
    Generate a clean Vietnamese response when Ollama is not yet started,
    so the user still gets useful product recommendations from MySQL without crashing.
    """
    base_msg = "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama."

    if not products:
        return f"{base_msg}\n\nHiện tại hệ thống chưa tìm thấy sản phẩm nào trong kho khớp với yêu cầu của bạn. Bạn có thể kiểm tra danh mục hoặc tìm kiếm theo từ khóa khác nhé!"

    product_lines = []
    for idx, p in enumerate(products[:3], 1):
        name = p.get("name")
        price = format_currency_vnd(p.get("price", 0))
        brand = p.get("brand_name") or p.get("brand") or ""
        stock = p.get("stock_quantity", 0)
        stock_text = "Còn hàng" if stock > 0 else "Tạm hết hàng"
        product_lines.append(f"{idx}. **{name}** ({brand}) - Giá: **{price}** ({stock_text})")

    cards_text = "\n".join(product_lines)
    return (
        f"{base_msg}\n\n"
        f"Tuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n"
        f"{cards_text}\n\n"
        f"👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!"
    )


def generate_suggestion_chips(
    intent_data: Dict[str, Any],
    recommended_products: List[Dict[str, Any]]
) -> List[str]:
    """Generate dynamic follow-up suggestion chips for the UI."""
    chips = []
    category = intent_data.get("category")
    features = intent_data.get("features", {})

    if "camera" in features:
        chips.append("So sánh camera chi tiết")
    if "gaming" in features:
        chips.append("Test game thực tế")

    if recommended_products and len(recommended_products) >= 2:
        chips.append(f"So sánh {recommended_products[0].get('name')[:15]} và {recommended_products[1].get('name')[:15]}")

    if not chips:
        if category == "phone":
            chips = ["Điện thoại pin trâu", "iPhone bán chạy", "Dưới 7 triệu"]
        elif category == "laptop":
            chips = ["Laptop mỏng nhẹ", "Laptop gaming", "Laptop sinh viên"]
        else:
            chips = ["Sản phẩm bán chạy nhất", "Tư vấn theo ngân sách", "Chính sách bảo hành"]

    return chips[:4]


def build_final_response(
    llm_output: Optional[Dict[str, Any]],
    recommended_products: List[Dict[str, Any]],
    intent_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Construct standardized JSON response for the API:
    {
        "success": True,
        "message": "...",
        "products": [...],
        "suggestions": [...],
        "intent": {...}
    }
    """
    sanitized_products = [sanitize_product_for_frontend(p) for p in recommended_products]
    suggestions = generate_suggestion_chips(intent_data, recommended_products)

    if llm_output and llm_output.get("success"):
        message_text = llm_output.get("message", "")
        return {
            "success": True,
            "message": message_text,
            "products": sanitized_products,
            "suggestions": suggestions,
            "intent": intent_data.get("primary_intent"),
            "model": llm_output.get("model")
        }

    # Ollama offline or error fallback
    fallback_text = format_offline_fallback(recommended_products, intent_data)
    error_reason = llm_output.get("error") if llm_output else "OLLAMA_OFFLINE"

    return {
        "success": True,
        "message": fallback_text,
        "products": sanitized_products,
        "suggestions": suggestions,
        "intent": intent_data.get("primary_intent"),
        "error_detail": error_reason,
        "is_fallback": True
    }
