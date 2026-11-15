"""
Intent Analysis Module
Parses Vietnamese user queries to extract:
- Main intent: search, consult, compare, price, stock, category, budget, brand, needs, multi-criteria, follow-up
- Structured criteria:
    * budget: budget_max, budget_min, budget_mode ("under", "over", "range", "around")
    * category: phone, laptop, tablet, headphone, speaker, charger, case, smartwatch, accessory
    * brand: Apple, Samsung, Xiaomi, Asus, Dell, Lenovo, HP, Acer, Sony, Oppo, MSI, JBL, Marshall, Anker
    * product_keywords: specific product/model keywords (e.g. ["airpod"], ["vivobook"], ["iphone 16 pro max"])
    * feature requirements: camera, gaming, battery, office, display, programming, anc, audio
    * comparison entities (e.g. "so sánh iPhone 15 và iPhone 16")
    * contextual resolution using previous chat messages
"""

import re
from typing import Dict, Any, List, Optional, Tuple


# Canonical categories ordered from specific to general so specific accessories match before general accessory
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "headphone": [
        "tai nghe", "headphone", "earphone", "earbuds", "airpod", "airpods",
        "chụp tai", "true wireless", "tws", "in-ear", "over-ear", "wh1000", "wh-1000", "wh1000xm6"
    ],
    "speaker": [
        "loa bluetooth", "loa không dây", "loa di động", "loa mini", "soundbar",
        "loa", "jbl flip", "flip 7", "emberton", "marshall emberton"
    ],
    "charger": [
        "củ sạc", "sạc nhanh", "cáp sạc", "sạc dự phòng", "adapter", "bộ sạc",
        "sạc type-c", "sạc pd", "anker nano", "ep-t2510n", "a121d", "sạc", "cáp"
    ],
    "case": [
        "ốp lưng", "bao da", "ốp điện thoại", "case điện thoại"
    ],
    "smartwatch": [
        "đồng hồ thông minh", "smartwatch", "apple watch", "galaxy watch", "đồng hồ"
    ],
    "phone": [
        "điện thoại", "smartphone", "dt", "phone", "đt", "dế yêu", "di động",
        "iphone", "galaxy s", "galaxy a", "galaxy z", "xiaomi redmi", "reno"
    ],
    "laptop": [
        "laptop", "máy tính xách tay", "notebook", "macbook", "ultrabook", "pc", "máy tính",
        "vivobook", "zenbook", "thinkpad", "ideapad", "legion", "cyborg", "pavilion", "victus", "inspiron", "xps", "240r"
    ],
    "tablet": [
        "máy tính bảng", "tablet", "ipad", "galaxy tab"
    ],
    "accessory": [
        "phụ kiện", "phụ kiện công nghệ", "chuột", "bàn phím", "thiết bị âm thanh"
    ]
}

BRAND_KEYWORDS: Dict[str, List[str]] = {
    "Apple": ["apple", "iphone", "ipad", "macbook", "airpods", "airpod", "táo khuyết", "ios"],
    "Samsung": ["samsung", "galaxy", "ep-t2510n"],
    "Xiaomi": ["xiaomi", "redmi", "poco", "mi"],
    "Asus": ["asus", "rog", "tuf", "zenbook", "vivobook", "x1404va", "x1404"],
    "MSI": ["msi", "mis", "cyborg", "katana", "stealth", "raider", "a13veo", "a13uc"],
    "HP": ["hp", "pavilion", "envy", "victus", "omen", "probook", "elitebook", "240r", "g10"],
    "Dell": ["dell", "xps", "inspiron", "vostro", "alienware", "latitude"],
    "Lenovo": ["lenovo", "thinkpad", "legion", "ideapad", "yoga", "loq"],
    "Acer": ["acer", "predator", "nitro", "aspire", "swift"],
    "Sony": ["sony", "wh1000xm6", "wh-1000xm6", "wh1000", "wf-1000", "playstation"],
    "JBL": ["jbl", "flip 7", "flip7", "charge 5", "pulse"],
    "Marshall": ["marshall", "emberton", "stanmore", "acton", "willen"],
    "Anker": ["anker", "powerport", "nano", "a121d", "iq3"],
    "Oppo": ["oppo", "reno", "find x"]
}

# Specific product/model keywords mapped to canonical search tokens
PRODUCT_MODEL_PATTERNS: List[Tuple[str, str]] = [
    (r'\biphone\s*16\s*pro\s*max\b', "iphone 16 pro max"),
    (r'\b16\s*pro\s*max\b', "iphone 16 pro max"),
    (r'\biphone\s*16\b(?!\s*pro)', "iphone 16"),
    (r'\biphone\s*15\s*pro\s*max\b', "iphone 15 pro max"),
    (r'\biphone\s*15\b', "iphone 15"),
    (r'\bairpods?\s*5\b', "airpods 5"),
    (r'\bairpods?\b', "airpod"),
    (r'\bwh[\-\s]?1000\s*xm6\b|\bwh1000\b|\bxm6\b', "wh1000xm6"),
    (r'\bflip\s*7\b', "flip 7"),
    (r'\bemberton(?:\s*ii|\s*2)?\b', "emberton"),
    (r'\bvivobook(?:\s*14)?\b|\bx1404(?:va)?\b', "vivobook"),
    (r'\b240r\b|\bg10\b|\bc3ru7at\b', "240r"),
    (r'\bcyborg\s*15\s*black\b|\ba13veo\b|\brtx\s*4050\b', "a13veo"),
    (r'\ba13uc\b|\brtx\s*3050\b', "a13uc"),
    (r'\bcyborg(?:\s*15)?\b', "cyborg"),
    (r'\banker\s*nano\b|\ba121d\b|\b45w\b', "a121d"),
    (r'\bep[\-\s]?t2510n\b|\b25w\b', "ep-t2510n"),
]


def _parse_money_token(num_str: str, dec_str: Optional[str], unit_str: Optional[str]) -> Optional[float]:
    """Helper to convert regex number + unit into VND float."""
    unit = (unit_str or "").lower().strip()
    if dec_str:
        val = float(f"{num_str}.{dec_str}")
        if unit in ["triệu", "trieu", "tr", "m", "củ", "cu"]:
            return val * 1_000_000
        elif unit in ["k", "nghìn", "nghin", "ngàn", "ngan"]:
            return val * 1_000
    else:
        cleaned = num_str.replace(".", "").replace(",", "")
        val = float(cleaned)
        if unit in ["triệu", "trieu", "tr", "m", "củ", "cu"]:
            return val * 1_000_000
        elif unit in ["k", "nghìn", "nghin", "ngàn", "ngan"]:
            return val * 1_000
        elif val >= 100_000:
            return val
    return None


def extract_budget_info(text: str) -> Dict[str, Any]:
    """
    Extract comprehensive budget criteria from Vietnamese text:
    Returns:
        {
            "budget": Optional[float],       # Primary budget reference (usually max or target)
            "budget_min": Optional[float],
            "budget_max": Optional[float],
            "budget_mode": Optional[str]     # "under", "over", "range", "around"
        }
    """
    text_lower = text.lower()
    result: Dict[str, Any] = {
        "budget": None,
        "budget_min": None,
        "budget_max": None,
        "budget_mode": None,
    }

    # 1. Range pattern: "từ 15 đến 25 triệu", "15 - 20 triệu", "15tr đến 20tr"
    range_match = re.search(
        r'(?:từ\s*)?(\d+(?:[,\.]\d+)?)\s*(?:triệu|trieu|tr|m|củ|cu)?\s*(?:đến|tới|\-|~)\s*(\d+(?:[,\.]\d+)?)\s*(triệu|trieu|tr|m|củ|cu|k|nghìn|nghin)',
        text_lower
    )
    if range_match:
        v1 = float(range_match.group(1).replace(",", "."))
        v2 = float(range_match.group(2).replace(",", "."))
        unit = range_match.group(3)
        mult = 1_000_000 if unit in ["triệu", "trieu", "tr", "m", "củ", "cu"] else 1_000
        b_min = min(v1, v2) * mult
        b_max = max(v1, v2) * mult
        return {
            "budget": b_max,
            "budget_min": b_min,
            "budget_max": b_max,
            "budget_mode": "range"
        }

    # Extract single money amount
    amount: Optional[float] = None

    # Pattern A: 8.5 triệu, 8,5 triệu
    compound_match = re.search(r'(\d+)[,\.](\d+)\s*(triệu|trieu|tr|m|củ|cu)\b', text_lower)
    if compound_match:
        amount = float(f"{compound_match.group(1)}.{compound_match.group(2)}") * 1_000_000

    # Pattern B: 8 triệu 500 / 8tr5
    if amount is None:
        part_match = re.search(r'(\d+)\s*(?:triệu|trieu|tr|củ|cu)\s*(\d{1,3})\s*(?:k|nghìn|nghin)?\b', text_lower)
        if part_match:
            tri = int(part_match.group(1))
            le = int(part_match.group(2))
            if le < 10:
                amount = float(tri * 1_000_000 + le * 100_000)
            elif le < 100:
                amount = float(tri * 1_000_000 + le * 10_000)
            else:
                amount = float(tri * 1_000_000 + le * 1_000)

    # Pattern C: 8 triệu, 8tr, 8m, 8 củ
    if amount is None:
        unit_match = re.search(r'(\d+)\s*(?:triệu|trieu|tr|củ|cu|m)\b', text_lower)
        if unit_match:
            amount = float(int(unit_match.group(1)) * 1_000_000)

    # Pattern D: 500k, 500 nghìn, 500 ngàn
    if amount is None:
        k_match = re.search(r'(\d+)\s*(?:k|nghìn|nghin|ngàn|ngan)\b', text_lower)
        if k_match:
            amount = float(int(k_match.group(1)) * 1_000)

    # Pattern E: 8.000.000 hoặc 8000000
    if amount is None:
        exact_match = re.search(r'(\d{1,3}(?:\.\d{3})+|\d{6,9})\s*(?:đ|vnd|dong|đồng)?\b', text_lower)
        if exact_match:
            cleaned = exact_match.group(1).replace(".", "")
            val = float(cleaned)
            if val >= 100_000:
                amount = val

    if amount is not None:
        if any(w in text_lower for w in ["trên ", "hơn ", "tối thiểu ", "ít nhất ", "từ "]):
            result["budget"] = amount
            result["budget_min"] = amount
            result["budget_mode"] = "over"
        elif any(w in text_lower for w in ["dưới ", "tối đa ", "không quá ", "đổ lại", "trở xuống", "<=", "<"]):
            result["budget"] = amount
            result["budget_max"] = amount
            result["budget_mode"] = "under"
        else:
            # "khoảng", "tầm", "quanh", or unspecified -> flexible target budget
            result["budget"] = amount
            result["budget_max"] = amount
            result["budget_mode"] = "around"

    return result


def extract_budget(text: str) -> Optional[float]:
    """Backward-compatible helper returning the primary budget float."""
    info = extract_budget_info(text)
    return info.get("budget")


def extract_category(text: str) -> Optional[str]:
    """
    Extract canonical product category from user query.
    Notice: If user explicitly mentions a category term like 'tai nghe', 'loa', 'sạc', 'laptop', 'điện thoại',
    prioritize the explicit category phrase before falling back to model keywords.
    """
    text_lower = text.lower()

    # Phase 1: Check explicit Vietnamese category nouns first so "tai nghe AirPod" or "sạc Samsung" or "tai nghe cho iPhone"
    # always resolves to the actual product type being asked!
    explicit_category_phrases = [
        ("headphone", ["tai nghe", "headphone", "earphone", "earbuds", "airpod", "airpods", "chụp tai", "true wireless"]),
        ("speaker", ["loa bluetooth", "loa không dây", "loa di động", "loa mini", "soundbar", "loa"]),
        ("charger", ["củ sạc", "sạc nhanh", "cáp sạc", "sạc dự phòng", "adapter", "bộ sạc", "cáp type-c"]),
        ("case", ["ốp lưng", "bao da"]),
        ("smartwatch", ["đồng hồ thông minh", "smartwatch", "apple watch", "galaxy watch"]),
        ("laptop", ["laptop", "máy tính xách tay", "notebook", "macbook", "ultrabook", "pc"]),
        ("tablet", ["máy tính bảng", "tablet", "ipad"]),
        ("phone", ["điện thoại", "smartphone", "dế yêu", "iphone"]),
    ]
    for cat, phrases in explicit_category_phrases:
        for kw in phrases:
            if re.search(r'(?<!\w)' + re.escape(kw) + r'(?!\w)', text_lower):
                return cat

    # Phase 2: Check full CATEGORY_KEYWORDS dictionary (including model names like vivobook, cyborg, wh1000xm6, flip 7)
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            if re.search(r'(?<!\w)' + re.escape(kw) + r'(?!\w)', text_lower):
                return cat
    return None


def extract_all_brands(text: str) -> List[str]:
    """Extract all mentioned brands in order of appearance."""
    text_lower = text.lower()
    found_brands: List[str] = []
    for brand, kws in BRAND_KEYWORDS.items():
        for kw in kws:
            if re.search(r'(?<!\w)' + re.escape(kw) + r'(?!\w)', text_lower):
                if brand not in found_brands:
                    found_brands.append(brand)
                break
    return found_brands


def extract_brand(text: str) -> Optional[str]:
    """Extract primary brand from user query."""
    brands = extract_all_brands(text)
    return brands[0] if brands else None


def extract_product_keywords(text: str) -> List[str]:
    """
    Extract specific product/model keywords from user query
    (e.g. 'airpod', 'iphone 16 pro max', 'vivobook', 'cyborg', 'wh1000xm6', 'flip 7', 'emberton').
    """
    text_lower = text.lower()
    keywords: List[str] = []
    for pattern, canonical_kw in PRODUCT_MODEL_PATTERNS:
        if re.search(pattern, text_lower):
            if canonical_kw not in keywords:
                keywords.append(canonical_kw)
    return keywords


def extract_features(text: str) -> Dict[str, str]:
    """
    Extract quality level for specific hardware/usage needs:
    - programming: high / medium
    - camera: high / medium
    - gaming: high / medium
    - battery: high / medium
    - office: high / medium
    - display: high / medium
    - anc: high / medium (noise cancelling / audio quality)
    """
    features: Dict[str, str] = {}
    text_lower = text.lower()

    # Programming / Coding / Engineering
    if any(re.search(r'(?<!\w)' + re.escape(k) + r'(?!\w)', text_lower) for k in [
        "lập trình", "code", "coding", "dev", "developer", "cntt", "công nghệ thông tin",
        "kỹ thuật", "chạy máy ảo", "docker", "android studio", "visual studio", "data science"
    ]):
        features["programming"] = "high"

    # Camera / Photography
    if any(k in text_lower for k in [
        "chụp ảnh đẹp", "chụp hình đẹp", "camera đẹp", "chụp ảnh nét",
        "quay video", "camera xịn", "sống ảo", "selfie đẹp", "chụp đêm", "zoom xa", "quay tiktok"
    ]):
        features["camera"] = "high"
    elif "camera" in text_lower or "chụp ảnh" in text_lower or "chụp hình" in text_lower:
        features["camera"] = "medium"

    # Gaming / Graphics
    if any(k in text_lower for k in [
        "chơi game tốt", "chơi game mượt", "chiến game", "gaming", "game nặng",
        "genshin", "pubg", "liên quân", "valorant", "cs2", "lol", "fps cao",
        "cấu hình khủng", "cấu hình mạnh", "card rời", "rtx", "đồ họa"
    ]):
        features["gaming"] = "high"
    elif "chơi game" in text_lower or "game" in text_lower:
        features["gaming"] = "medium"

    # Battery / Fast charging
    if any(k in text_lower for k in [
        "pin trâu", "pin khủng", "dùng cả ngày", "sạc nhanh", "pin tốt", "pin lâu", "thời lượng pin"
    ]):
        features["battery"] = "high"
    elif "pin" in text_lower:
        features["battery"] = "medium"

    # Office / Study / Portability
    if any(k in text_lower for k in [
        "văn phòng", "học tập", "sinh viên", "word", "excel", "nhẹ gọn", "mỏng nhẹ",
        "đi học", "làm việc", "kế toán", "học online"
    ]):
        features["office"] = "high"

    # Screen / Display
    if any(k in text_lower for k in [
        "màn hình đẹp", "oled", "amoled", "120hz", "144hz", "màn to", "full hd", "retina"
    ]):
        features["display"] = "high"

    # Audio / Noise Cancelling (ANC) / Waterproof
    if any(k in text_lower for k in [
        "chống ồn", "anc", "xuyên âm", "bass căng", "bass mạnh", "âm thanh hay",
        "nghe nhạc", "chống nước", "ip57", "ip67", "bluetooth"
    ]):
        features["anc"] = "high"

    return features


def detect_intents(text: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> List[str]:
    """
    Detect matching intent categories:
    - compare_products
    - ask_stock
    - ask_price
    - ask_budget
    - ask_brand
    - ask_category
    - ask_needs
    - ask_multi_criteria
    - follow_up
    - find_product
    - consult_product
    """
    intents: List[str] = []
    text_lower = text.lower()

    # 1. Comparison
    if any(k in text_lower for k in ["so sánh", "khác nhau gì", "khác gì", "hơn hay kém", "nên mua cái nào", "nên chọn máy nào", "versus", " vs "]):
        intents.append("compare_products")

    # 2. Stock inquiry
    if any(k in text_lower for k in ["còn hàng không", "còn hàng ko", "hết hàng chưa", "tồn kho", "sẵn hàng không", "có sẵn không"]):
        intents.append("ask_stock")

    # 3. Price inquiry
    if any(k in text_lower for k in ["giá bao nhiêu", "bao nhiêu tiền", "nhiêu tiền", "báo giá", "giá cả", "giá sao"]):
        intents.append("ask_price")

    # 4. Budget inquiry
    budget_info = extract_budget_info(text)
    if budget_info.get("budget") is not None or any(k in text_lower for k in ["triệu", "ngân sách", "tầm giá", "tài chính", "dưới ", "khoảng ", "trên "]):
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
    # Only mark as follow-up if the query explicitly references previous context
    # AND does not introduce a completely new standalone product/category search.
    has_explicit_new_topic = bool(extract_category(text)) and bool(extract_brand(text) or extract_product_keywords(text))
    is_follow_up = False
    if any(k in text_lower for k in [
        "còn máy khác", "máy khác", "còn con nào khác", "rẻ hơn", "đắt hơn", "cao hơn", "thấp hơn",
        "thế còn", "vậy còn", "còn mẫu nào", "còn loại nào", "cái thứ hai", "mẫu đầu tiên",
        "nó có", "con này có", "máy này có", "mẫu này", "sản phẩm này"
    ]):
        is_follow_up = True
    elif not has_explicit_new_topic and len(text.strip().split()) <= 4 and conversation_history and len(conversation_history) > 0:
        is_follow_up = True

    if is_follow_up and conversation_history:
        intents.append("follow_up")

    # 9. Multi-criteria: has budget + needs OR brand + budget, etc.
    criteria_count = sum([
        1 if budget_info.get("budget") else 0,
        1 if extract_category(text) else 0,
        1 if extract_brand(text) else 0,
        len(features)
    ])
    if criteria_count >= 2:
        intents.append("ask_multi_criteria")

    # 10. Default classification
    if not intents:
        if any(k in text_lower for k in ["tìm", "có bán", "muốn mua", "xem", "có những", "danh sách"]):
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
    Skips any message in history that duplicates `current_text` (in case the caller
    already saved the current user message to the DB before fetching history).
    """
    context: Dict[str, Any] = {}
    if not conversation_history:
        return context

    current_clean = current_text.strip().lower()

    # Look backwards through previous user messages
    for msg in reversed(conversation_history):
        role = msg.get("role") or ("user" if msg.get("sender_type") == "user" else "assistant")
        if role == "user":
            prev_text = (msg.get("content") or msg.get("message") or "").strip()
            if not prev_text or prev_text.lower() == current_clean:
                continue

            prev_brand = extract_brand(prev_text)
            prev_cat = extract_category(prev_text)
            prev_budget = extract_budget(prev_text)
            prev_feats = extract_features(prev_text)
            prev_kws = extract_product_keywords(prev_text)

            if "category" not in context and prev_cat:
                context["category"] = prev_cat
            if "brand" not in context and prev_brand:
                context["brand"] = prev_brand
            if "budget" not in context and prev_budget:
                context["budget"] = prev_budget
            if "features" not in context and prev_feats:
                context["features"] = prev_feats
            if "product_keywords" not in context and prev_kws:
                context["product_keywords"] = prev_kws
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
    budget_info = extract_budget_info(message)
    budget = budget_info.get("budget")
    budget_min = budget_info.get("budget_min")
    budget_max = budget_info.get("budget_max")
    budget_mode = budget_info.get("budget_mode")

    category = extract_category(message)
    brand = extract_brand(message)
    all_brands = extract_all_brands(message)
    product_keywords = extract_product_keywords(message)
    features = extract_features(message)

    # Context inheritance ONLY if follow_up and current message didn't specify a new category/product
    if "follow_up" in intents and conversation_history:
        inherited = resolve_context_from_history(message, conversation_history)
        if not category and "category" in inherited:
            category = inherited["category"]
        if not brand and "brand" in inherited:
            brand = inherited["brand"]
        if not product_keywords and "product_keywords" in inherited and not brand:
            product_keywords = inherited["product_keywords"]

        msg_low = message.lower()
        if "rẻ hơn" in msg_low or "thấp hơn" in msg_low:
            if not budget and "budget" in inherited and inherited["budget"]:
                budget = inherited["budget"] * 0.8
                budget_max = budget
                budget_mode = "under"
        elif "đắt hơn" in msg_low or "cao hơn" in msg_low or "xịn hơn" in msg_low:
            if not budget and "budget" in inherited and inherited["budget"]:
                budget = inherited["budget"] * 1.3
                budget_min = inherited["budget"]
                budget_mode = "over"
        elif not budget and "budget" in inherited:
            budget = inherited["budget"]
            budget_max = budget

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
        "budget_min": budget_min,
        "budget_max": budget_max,
        "budget_mode": budget_mode,
        "category": category,
        "brand": brand,
        "all_brands": all_brands,
        "product_keywords": product_keywords,
        "features": features
    }
