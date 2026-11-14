"""
Intent Analysis Module
Parses Vietnamese user queries to extract:
- Main intent: search, consult, compare, price, stock, category, budget, brand, needs, multi-criteria, follow-up
- Structured criteria:
    * budget: max_price, min_price
    * category: phone, laptop, tablet, accessory, etc.
    * brand: Apple, Samsung, Xiaomi, Asus, Dell, Lenovo, HP, etc.
    * feature requirements: camera, gaming, battery, office, display
    * comparison entities (e.g. "so sánh iPhone 15 và S24")
    * contextual resolution using previous chat messages
"""

import re
from typing import Dict, Any, List, Optional


# Canonical categories and brands
CATEGORY_KEYWORDS = {
    "phone": ["điện thoại", "smartphone", "dt", "phone", "đt", "iphone", "galaxy", "xiaomi redmi"],
    "laptop": ["laptop", "máy tính xách tay", "notebook", "macbook", "ultrabook", "pc", "máy tính"],
    "tablet": ["máy tính bảng", "tablet", "ipad", "tab"],
    "accessory": ["phụ kiện", "tai nghe", "chuột", "bàn phím", "sạc", "cáp", "củ sạc", "ốp lưng", "loa", "smartwatch", "đồng hồ"]
}

BRAND_KEYWORDS = {
    "Apple": ["apple", "iphone", "ipad", "macbook", "airpods"],
    "Samsung": ["samsung", "galaxy"],
    "Xiaomi": ["xiaomi", "redmi", "poco"],
    "Asus": ["asus", "rog", "tuf", "zenbook", "vivobook"],
    "Dell": ["dell", "xps", "inspiron", "vostro", "alienware"],
    "Lenovo": ["lenovo", "thinkpad", "legion", "ideapad"],
    "HP": ["hp", "pavilion", "envy", "victus", "omen"],
    "Acer": ["acer", "predator", "nitro", "aspire"],
    "Sony": ["sony", "playstation"],
    "Oppo": ["oppo", "reno", "find"]
}


def extract_budget(text: str) -> Optional[float]:
    """
    Extract budget amount from Vietnamese natural text.
    Handles:
    - "8 triệu", "8tr", "8 trieu", "8m", "8 củ", "8tr5", "8.5 triệu", "8,5 triệu"
    - "dưới 10 triệu", "khoảng 15tr", "tầm 7 triệu"
    - "8000000", "8.000.000đ", "8000k"
    """
    text_lower = text.lower()

    # Pattern: 8tr5, 8.5 triệu, 8,5 triệu, 8 củ 5, 8 triệu 5
    compound_match = re.search(r'(\d+)[,\.](\d+)\s*(triệu|trieu|tr|m|củ|cu)', text_lower)
    if compound_match:
        integer_part = compound_match.group(1)
        decimal_part = compound_match.group(2)
        val = float(f"{integer_part}.{decimal_part}")
        return val * 1_000_000

    # Pattern: 8 triệu 500 / 8tr5
    part_match = re.search(r'(\d+)\s*(?:triệu|trieu|tr|củ|cu)\s*(\d{1,3})\s*(?:k|nghìn|nghin)?', text_lower)
    if part_match:
        tri = int(part_match.group(1))
        le = int(part_match.group(2))
        if le < 10:
            return tri * 1_000_000 + le * 100_000
        elif le < 100:
            return tri * 1_000_000 + le * 10_000
        else:
            return tri * 1_000_000 + le * 1_000

    # Pattern: 8 triệu, 8tr, 8m, 8 củ
    unit_match = re.search(r'(\d+)\s*(?:triệu|trieu|tr|củ|cu|m)\b', text_lower)
    if unit_match:
        val = int(unit_match.group(1))
        return float(val * 1_000_000)

    # Pattern: 8000k
    k_match = re.search(r'(\d+)\s*k\b', text_lower)
    if k_match:
        val = int(k_match.group(1))
        return float(val * 1_000)

    # Pattern: 8.000.000 hoặc 8000000
    exact_match = re.search(r'(\d{1,3}(?:\.\d{3})+|\d{6,9})\s*(?:đ|vnd|dong|đồng)?', text_lower)
    if exact_match:
        cleaned = exact_match.group(1).replace(".", "")
        val = float(cleaned)
        if val >= 100_000:
            return val

    return None


def extract_category(text: str) -> Optional[str]:
    text_lower = text.lower()
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return cat
    return None


def extract_brand(text: str) -> Optional[str]:
    text_lower = text.lower()
    for brand, kws in BRAND_KEYWORDS.items():
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return brand
    return None


def extract_features(text: str) -> Dict[str, str]:
    """
    Extract quality level for specific hardware needs:
    - camera: high / normal
    - gaming: high / normal
    - battery: high / normal
    - office: high / normal
    """
    features = {}
    text_lower = text.lower()

    # Camera
    if any(k in text_lower for k in [
        "chụp ảnh đẹp", "chụp hình đẹp", "camera đẹp", "chụp ảnh nét",
        "quay video", "camera xịn", "sống ảo", "selfie đẹp", "chụp đêm"
    ]):
        features["camera"] = "high"
    elif "camera" in text_lower or "chụp ảnh" in text_lower or "chụp hình" in text_lower:
        features["camera"] = "medium"

    # Gaming
    if any(k in text_lower for k in [
        "chơi game tốt", "chơi game mượt", "chiến game", "gaming", "game nặng",
        "genshin", "pubg", "liên quân max", "fps cao", "cấu hình khủng", "cấu hình mạnh"
    ]):
        features["gaming"] = "high"
    elif "chơi game" in text_lower or "game" in text_lower:
        features["gaming"] = "medium"

    # Battery
    if any(k in text_lower for k in [
        "pin trâu", "pin khủng", "dùng cả ngày", "sạc nhanh", "pin tốt", "pin lâu"
    ]):
        features["battery"] = "high"
    elif "pin" in text_lower:
        features["battery"] = "medium"

    # Office / Study
    if any(k in text_lower for k in [
        "văn phòng", "học tập", "sinh viên", "word", "excel", "nhẹ gọn", "mỏng nhẹ", "đi học", "làm việc"
    ]):
        features["office"] = "high"

    # Screen / Display
    if any(k in text_lower for k in [
        "màn hình đẹp", "oled", "amoled", "120hz", "144hz", "màn to", "võng mạc"
    ]):
        features["display"] = "high"

    return features


def detect_intents(text: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> List[str]:
    """
    Detect matching intent categories:
    - compare
    - stock_inquiry
    - price_inquiry
    - budget_inquiry
    - brand_inquiry
    - category_inquiry
    - needs_inquiry
    - multi_criteria
    - follow_up
    - product_search
    - product_consultation
    """
    intents = []
    text_lower = text.lower()

    # 1. Comparison
    if any(k in text_lower for k in ["so sánh", "khác nhau gì", "hơn hay kém", "nên mua cái nào hơn", "versus", " vs "]):
        intents.append("compare_products")

    # 2. Stock inquiry
    if any(k in text_lower for k in ["còn hàng không", "còn hàng ko", "hết hàng chưa", "tồn kho", "sẵn hàng không"]):
        intents.append("ask_stock")

    # 3. Price inquiry
    if any(k in text_lower for k in ["giá bao nhiêu", "bao nhiêu tiền", "nhiêu tiền", "báo giá", "giá cả"]):
        intents.append("ask_price")

    # 4. Budget inquiry
    if extract_budget(text) is not None or any(k in text_lower for k in ["triệu", "ngân sách", "tầm giá", "tài chính", "dưới", "khoảng"]):
        intents.append("ask_budget")

    # 5. Brand inquiry
    if extract_brand(text) is not None:
        intents.append("ask_brand")

    # 6. Category inquiry
    if extract_category(text) is not None:
        intents.append("ask_category")

    # 7. Needs inquiry
    features = extract_features(text)
    if len(features) > 0:
        intents.append("ask_needs")

    # 8. Follow-up inquiry
    # Check if query references previous conversation: "còn máy khác không", "rẻ hơn chút", "màu khác", "thế còn...", "thế mẫu này thì sao"
    is_follow_up = False
    if any(k in text_lower for k in [
        "còn máy khác", "máy khác", "còn con nào khác", "rẻ hơn", "đắt hơn",
        "thế còn", "vậy còn", "còn mẫu nào", "còn loại nào", "cái thứ hai", "mẫu đầu tiên",
        "nó có", "con này có", "máy này có"
    ]):
        is_follow_up = True
    elif len(text.strip().split()) <= 4 and conversation_history and len(conversation_history) > 0:
        # Short reply like "thế 10 triệu thì sao?" or "màu đen có ko?"
        is_follow_up = True

    if is_follow_up and conversation_history:
        intents.append("follow_up")

    # 9. Multi-criteria: has budget + needs OR brand + budget, etc.
    criteria_count = sum([
        1 if extract_budget(text) else 0,
        1 if extract_category(text) else 0,
        1 if extract_brand(text) else 0,
        len(features)
    ])
    if criteria_count >= 2:
        intents.append("ask_multi_criteria")

    # 10. Default classification
    if not intents:
        if any(k in text_lower for k in ["tìm", "có bán", "muốn mua", "xem"]):
            intents.append("find_product")
        else:
            intents.append("consult_product")

    return intents


def resolve_context_from_history(
    current_text: str,
    conversation_history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Inherit context from recent history when current query is a follow-up.
    For example:
    Prev: "Tôi muốn tìm iPhone khoảng 15 triệu"
    Next: "Còn con nào rẻ hơn không?" -> retains brand: Apple, category: phone, lowers budget.
    """
    context = {}
    if not conversation_history:
        return context

    # Look backwards through the last 4 user messages
    for msg in reversed(conversation_history):
        if msg.get("role") == "user":
            prev_text = msg.get("content", "")
            prev_brand = extract_brand(prev_text)
            prev_cat = extract_category(prev_text)
            prev_budget = extract_budget(prev_text)
            prev_feats = extract_features(prev_text)

            if "category" not in context and prev_cat:
                context["category"] = prev_cat
            if "brand" not in context and prev_brand:
                context["brand"] = prev_brand
            if "budget" not in context and prev_budget:
                context["budget"] = prev_budget
            if "features" not in context and prev_feats:
                context["features"] = prev_feats
            break

    return context


def parse_user_intent(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Main entry point for intent parsing.
    Returns structured analysis for recommendation and LLM prompt generation.
    """
    intents = detect_intents(message, conversation_history)
    budget = extract_budget(message)
    category = extract_category(message)
    brand = extract_brand(message)
    features = extract_features(message)

    # Context inheritance if follow-up
    if "follow_up" in intents and conversation_history:
        inherited = resolve_context_from_history(message, conversation_history)
        if not category and "category" in inherited:
            category = inherited["category"]
        if not brand and "brand" in inherited:
            brand = inherited["brand"]
        # Handle "rẻ hơn"
        if "rẻ hơn" in message.lower() and "budget" in inherited:
            budget = inherited["budget"] * 0.8
        elif not budget and "budget" in inherited:
            budget = inherited["budget"]

        for k, v in inherited.get("features", {}).items():
            if k not in features:
                features[k] = v

    primary_intent = intents[0] if intents else "consult_product"

    return {
        "raw_message": message,
        "primary_intent": primary_intent,
        "all_intents": intents,
        "is_multi_criteria": "ask_multi_criteria" in intents,
        "is_follow_up": "follow_up" in intents,
        "is_comparison": "compare_products" in intents,
        "budget": budget,
        "category": category,
        "brand": brand,
        "features": features
    }
