"""
Response Formatting, Post-Processing Guardrails, and Fallback Handling Module
Ensures clean outputs, product card attachments, suggestion chips,
anti-contradiction post-processing, and graceful offline fallbacks.
"""

import re
from typing import List, Dict, Any, Optional
from chatbot.product_context import sanitize_product_for_frontend, format_currency_vnd


def clean_contradictory_llm_text(
    message_text: str,
    recommended_products: List[Dict[str, Any]],
    intent_data: Dict[str, Any]
) -> str:
    """
    Post-processing guardrail:
    When `recommended_products` has exact matches (e.g., `AirPods 5` for query `"tai nghe AirPod"`),
    smaller local models (like qwen2.5:3b) may occasionally output a contradictory opening sentence
    such as "Hiện tại hệ thống chưa có sản phẩm AirPods..." right before listing `AirPods 5`.
    This function detects and repairs that contradiction automatically.
    """
    if not message_text or not recommended_products:
        return message_text

    exact_matches = [p for p in recommended_products if p.get("match_type") == "exact_match"]
    if not exact_matches:
        return message_text

    # Check if the opening paragraph falsely claims we don't have the product
    false_negative_patterns = [
        r'hiện tại[,\s]+(?:hệ thống|cửa hàng).*?(?:chưa có|không có|không tìm thấy)\s+sản phẩm.*?(?:\.|\n)',
        r'rất tiếc[,\s]+(?:hiện tại\s+)?(?:hệ thống|cửa hàng).*?(?:chưa có|không có)\s+sản phẩm.*?(?:\.|\n)',
        r'tuy nhiên[,\s]+anh/chị có thể xem xét một số sản phẩm tương đương.*?(?:\:|\n)',
    ]

    lower_head = message_text[:350].lower()
    has_false_negative = any(
        phrase in lower_head
        for phrase in ["chưa có sản phẩm", "không có sản phẩm", "không tìm thấy sản phẩm", "chưa kinh doanh"]
    )

    if has_false_negative:
        cleaned = message_text
        for pat in false_negative_patterns:
            cleaned = re.sub(pat, "", cleaned, count=1, flags=re.IGNORECASE)
        cleaned = cleaned.strip().lstrip("*").strip()

        first_prod = exact_matches[0]
        p_name = first_prod.get("name", "sản phẩm")
        p_price = format_currency_vnd(first_prod.get("price", 0))
        positive_intro = (
            f"Dạ hiện tại cửa hàng đang có sẵn **{p_name}** chính hãng với mức giá ưu đãi **{p_price}**. "
            f"Em xin gửi anh/chị thông tin chi tiết của sản phẩm ạ:\n\n"
        )
        return positive_intro + cleaned

    return message_text


def format_offline_fallback(products: List[Dict[str, Any]], intent_data: Dict[str, Any]) -> str:
    """
    Generate a clean, natural Vietnamese consultation response directly from MySQL product data
    when Ollama is offline or times out, so the user always gets a smart and helpful answer.
    """
    if not products:
        return (
            "Dạ hiện tại hệ thống chưa tìm thấy sản phẩm nào trong kho khớp chính xác với tiêu chí này của anh/chị. "
            "Anh/chị có thể thử điều chỉnh tầm giá hoặc tham khảo các dòng Điện thoại iPhone, Laptop Asus/HP/MSI, "
            "Tai nghe AirPods/Sony, Loa JBL/Marshall đang có sẵn tại cửa hàng nhé!"
        )

    exact_matches = [p for p in products if p.get("match_type") == "exact_match"]
    budget = intent_data.get("budget")

    if exact_matches:
        intro = f"Dạ cửa hàng hiện đang có sẵn **{len(products)} sản phẩm** phù hợp với nhu cầu của anh/chị:"
    elif budget:
        intro = f"Dạ với tầm ngân sách khoảng **{format_currency_vnd(budget)}**, em xin gợi ý các mẫu phù hợp nhất đang có sẵn tại cửa hàng:"
    else:
        intro = "Dạ em xin gợi ý các sản phẩm nổi bật và phù hợp nhất hiện có trong kho của cửa hàng:"

    product_lines = []
    for idx, p in enumerate(products[:4], 1):
        name = p.get("name")
        price = format_currency_vnd(p.get("price", 0))
        brand = p.get("brand_name") or p.get("brand") or "Chính hãng"
        stock = p.get("stock_quantity", 0)
        stock_text = f"Còn {stock} sản phẩm" if stock > 0 else "Tạm hết hàng"
        desc = (p.get("short_description") or p.get("description") or "").strip()
        line = f"{idx}. **{name}** ({brand})\n   - **Giá bán:** {price} | **Kho:** {stock_text}"
        if desc:
            line += f"\n   - **Điểm nổi bật:** {desc[:180]}"
        product_lines.append(line)

    cards_text = "\n\n".join(product_lines)
    return (
        f"{intro}\n\n"
        f"{cards_text}\n\n"
        f"👉 Anh/chị có thể nhấn trực tiếp vào thẻ sản phẩm bên dưới để xem chi tiết hoặc đặt mua ngay ạ!"
    )


def generate_suggestion_chips(
    intent_data: Dict[str, Any],
    recommended_products: List[Dict[str, Any]]
) -> List[str]:
    """Generate dynamic follow-up suggestion chips for the UI."""
    chips: List[str] = []
    category = intent_data.get("category")
    features = intent_data.get("features", {})

    if recommended_products and len(recommended_products) >= 2:
        p1 = (recommended_products[0].get("name") or "")[:18].strip()
        p2 = (recommended_products[1].get("name") or "")[:18].strip()
        chips.append(f"So sánh {p1} và {p2}")
    elif recommended_products and len(recommended_products) == 1:
        p1 = (recommended_products[0].get("name") or "")[:22].strip()
        chips.append(f"{p1} còn hàng không?")

    if category == "headphone":
        chips.extend(["Tai nghe chống ồn ANC", "Tai nghe Sony WH1000XM6", "Tai nghe AirPods 5"])
    elif category == "speaker":
        chips.extend(["So sánh JBL Flip 7 và Marshall", "Loa Bluetooth chống nước", "Loa dưới 4 triệu"])
    elif category == "charger":
        chips.extend(["Sạc nhanh 45W Anker", "Sạc nhanh 25W Samsung", "Tư vấn phụ kiện"])
    elif category == "phone":
        chips.extend(["iPhone dưới 20 triệu", "So sánh iPhone 15 và iPhone 16", "iPhone 16 Pro Max"])
    elif category == "laptop":
        chips.extend(["Laptop lập trình dưới 20 triệu", "Laptop gaming RTX", "So sánh Laptop HP và Asus"])
    else:
        if "programming" in features:
            chips.append("Laptop RAM 16GB lập trình")
        if "gaming" in features:
            chips.append("Laptop MSI Gaming Cyborg")
        chips.extend(["Tai nghe AirPods 5", "Laptop dưới 20 triệu", "Điện thoại iPhone nổi bật"])

    # Deduplicate while preserving order
    unique_chips: List[str] = []
    for c in chips:
        if c not in unique_chips:
            unique_chips.append(c)

    return unique_chips[:4]


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
        "intent": "..."
    }
    """
    sanitized_products = [sanitize_product_for_frontend(p) for p in recommended_products]
    suggestions = generate_suggestion_chips(intent_data, recommended_products)

    if llm_output and llm_output.get("success"):
        raw_message = llm_output.get("message", "")
        cleaned_message = clean_contradictory_llm_text(
            message_text=raw_message,
            recommended_products=recommended_products,
            intent_data=intent_data
        )
        return {
            "success": True,
            "message": cleaned_message,
            "products": sanitized_products,
            "suggestions": suggestions,
            "intent": intent_data.get("primary_intent"),
            "model": llm_output.get("model")
        }

    # Ollama offline or timeout fallback
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
