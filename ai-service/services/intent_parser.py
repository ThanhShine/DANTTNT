"""
Intent Parser — Phân tích ý định người dùng từ tin nhắn tiếng Việt
Phiên bản nâng cao: hiểu ngôn ngữ tự nhiên phong phú hơn

Trích xuất:
- intent: loại ý định
- category: danh mục sản phẩm (bao gồm category_db cho truy vấn database)
- budget_min / budget_max: ngân sách (VND)
- keywords: từ khóa sạch để tìm kiếm
- purpose: mục đích sử dụng
- brands: thương hiệu quan tâm
- product_names: tên sản phẩm cụ thể người dùng nhắc đến
- sentiment: cảm nhận (cheap, premium, best)
"""

import re
from typing import Optional
from pydantic import BaseModel


class ParsedIntent(BaseModel):
    intent: str = "general"
    category: Optional[str] = None          # Tên tiếng Việt để tìm trong DB
    category_db: Optional[str] = None       # Slug để fallback
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    keywords: list[str] = []
    purpose: Optional[str] = None
    brands: list[str] = []
    compare_products: list[str] = []
    product_names: list[str] = []           # Tên sản phẩm cụ thể ("iPhone 15", "Galaxy S24")
    sentiment: Optional[str] = None         # "cheap", "premium", "best", "popular"


# ── Category Map: slug → [từ khóa nhận diện tiếng Việt + tiếng Anh] ────
# Key đầu tiên trong list là tên dùng để truy vấn DB
CATEGORY_MAP: dict[str, list[str]] = {
    "laptop": [
        "laptop", "máy tính xách tay", "notebook", "macbook", "ultrabook",
        "máy tính", "máy tính cá nhân", "latop", "lap top"
    ],
    "smartphone": [
        "điện thoại", "smartphone", "iphone", "android", "di động", "phone",
        "điện thoại thông minh", "dòng điện thoại", "dt", "dien thoai",
        "màn hình điện thoại", "máy điện thoại"
    ],
    "tablet": [
        "máy tính bảng", "tablet", "ipad", "tab", "máy bảng"
    ],
    "desktop": [
        "máy tính bàn", "desktop", "pc", "máy tính để bàn", "case máy tính",
        "thùng máy"
    ],
    "monitor": [
        "màn hình", "monitor", "display", "màn hình máy tính", "màn"
    ],
    "keyboard": [
        "bàn phím", "keyboard", "mechanical", "cơ học", "bàn phím cơ", "phím cơ"
    ],
    "mouse": [
        "chuột", "mouse", "trackpad", "chuột máy tính", "chuột không dây"
    ],
    "headphone": [
        "tai nghe", "headphone", "earphone", "earbuds", "airpods",
        "headset", "tai phone", "nghe nhạc", "chống ồn", "in-ear", "over-ear"
    ],
    "camera": [
        "máy ảnh", "camera", "dslr", "mirrorless", "máy chụp ảnh", "chụp hình"
    ],
    "smartwatch": [
        "đồng hồ thông minh", "smartwatch", "apple watch", "đồng hồ",
        "watch", "đồng hồ thể thao", "galaxy watch"
    ],
    "speaker": [
        "loa", "speaker", "loa bluetooth", "loa di động", "sound bar", "soundbar"
    ],
    "printer": [
        "máy in", "printer", "in ấn", "máy in laser", "máy in phun"
    ],
    "router": [
        "router", "wifi", "modem", "bộ phát wifi", "access point", "bộ định tuyến"
    ],
    "ssd": [
        "ổ cứng", "ssd", "hdd", "hard drive", "nvme", "ổ lưu trữ",
        "bộ nhớ ngoài", "ổ đĩa"
    ],
    "ram": [
        "ram", "bộ nhớ ram", "memory"
    ],
    "gpu": [
        "card đồ họa", "gpu", "vga", "graphics card", "card màn hình",
        "card game", "card gaming"
    ],
    "charger": [
        "sạc", "củ sạc", "cáp sạc", "sạc dự phòng", "pin dự phòng",
        "adapter sạc", "sạc nhanh"
    ],
    "case": [
        "ốp lưng", "case điện thoại", "bao da", "túi đựng laptop", "balo",
        "túi chống sốc"
    ],
}

PURPOSE_MAP: dict[str, list[str]] = {
    "gaming": [
        "gaming", "chơi game", "game", "fps", "esport", "moba", "rpg",
        "chơi game online", "game thủ", "streamer", "stream game",
        "chơi pubg", "chơi liên quân", "chơi lol", "chơi fortnite"
    ],
    "lập trình": [
        "lập trình", "code", "coding", "developer", "dev", "programming",
        "kỹ sư phần mềm", "software", "backend", "frontend", "web developer",
        "data science", "machine learning", "ai", "làm việc với code"
    ],
    "văn phòng": [
        "văn phòng", "office", "word", "excel", "powerpoint", "làm việc",
        "công việc", "làm văn phòng", "nhân viên", "kế toán", "quản lý",
        "soạn thảo", "họp online", "zoom"
    ],
    "thiết kế": [
        "thiết kế", "design", "photoshop", "illustrator", "render", "3d",
        "đồ họa", "graphic design", "ui/ux", "ux", "ui", "dựng phim",
        "adobe", "canva", "figma", "autocad"
    ],
    "học tập": [
        "học tập", "học", "sinh viên", "student", "đại học", "học sinh",
        "trường", "đi học", "sinh viên đại học", "làm bài tập", "nghiên cứu",
        "luận văn", "online course"
    ],
    "quay phim": [
        "quay phim", "video", "youtube", "vlog", "streaming", "content creator",
        "làm video", "quay video", "chỉnh video", "premiere", "after effects"
    ],
    "âm nhạc": [
        "âm nhạc", "âm thanh", "music", "audio", "dj", "nghe nhạc",
        "sản xuất âm nhạc", "thu âm", "studio", "podcast"
    ],
    "kinh doanh": [
        "kinh doanh", "doanh nghiệp", "business", "thương mại", "bán hàng",
        "quản lý shop", "startup"
    ],
    "chụp ảnh": [
        "chụp ảnh", "nhiếp ảnh", "chụp hình", "photography", "portrait",
        "landscape", "camera phone"
    ],
}

BRAND_MAP: dict[str, list[str]] = {
    "apple":        ["apple", "iphone", "ipad", "macbook", "airpods", "apple watch"],
    "samsung":      ["samsung", "galaxy", "note"],
    "asus":         ["asus", "rog", "zenbook", "vivobook", "tuf"],
    "acer":         ["acer", "aspire", "nitro", "predator", "swift"],
    "dell":         ["dell", "xps", "inspiron", "alienware", "latitude"],
    "hp":           ["hp", "pavilion", "envy", "spectre", "omen", "elitebook"],
    "lenovo":       ["lenovo", "thinkpad", "ideapad", "legion", "yoga"],
    "msi":          ["msi", "msi gaming"],
    "lg":           ["lg", "lg gram", "lg monitor"],
    "sony":         ["sony", "xperia", "wh-1000", "wf-", "walkman"],
    "xiaomi":       ["xiaomi", "redmi", "poco", "mi "],
    "oppo":         ["oppo", "find x", "reno"],
    "vivo":         ["vivo", "x series"],
    "huawei":       ["huawei", "matebook", "honor"],
    "microsoft":    ["microsoft", "surface"],
    "logitech":     ["logitech", "logi"],
    "razer":        ["razer", "razer blade"],
    "corsair":      ["corsair"],
    "intel":        ["intel", "core i"],
    "amd":          ["amd", "ryzen"],
    "nvidia":       ["nvidia", "rtx", "gtx", "geforce"],
    "jbl":          ["jbl"],
    "bose":         ["bose"],
    "sennheiser":   ["sennheiser"],
    "anker":        ["anker"],
    "baseus":       ["baseus"],
}

# Từ tắt thương hiệu người Việt hay dùng
BRAND_ALIASES = {
    "ss": "samsung",
    "xm": "xiaomi",
    "sam": "samsung",
}

# Từ khóa diễn đạt cảm nhận / yêu cầu mức độ
SENTIMENT_KEYWORDS = {
    "cheap":   ["rẻ", "giá rẻ", "tiết kiệm", "bình dân", "phổ thông", "không tốn kém",
                "túi tiền sinh viên", "giá thấp", "giá tốt"],
    "premium": ["cao cấp", "sang", "xịn", "premium", "flagship", "top tier",
                "chất lượng nhất", "tốt nhất", "đỉnh", "pro", "ultra", "max", "plus"],
    "best":    ["tốt nhất", "bán chạy nhất", "phổ biến", "hot", "đánh giá cao",
                "nhiều người dùng", "được yêu thích", "ưa chuộng"],
    "popular": ["nhiều người dùng", "phổ biến", "bán chạy", "hot nhất",
                "mua nhiều nhất", "bestseller"],
}


# ── Tên sản phẩm cụ thể phổ biến (regex) ─────────────────────────
PRODUCT_NAME_PATTERNS = [
    r'iphone\s*\d+(?:\s*(?:pro|plus|max|mini))*',
    r'galaxy\s*[a-z]*\s*\d+(?:\s*(?:ultra|plus|fe|s|e))*',
    r'redmi\s*(?:note\s*)?\d+\s*(?:pro|plus)?',
    r'macbook\s*(?:pro|air|m\d)?(?:\s*\d+)?',
    r'ipad\s*(?:pro|air|mini)?(?:\s*\d+)?',
    r'airpods\s*(?:pro|max)?(?:\s*\d+)?',
    r'wh-\d+\w*',
    r'rog\s*\w+',
    r'thinkpad\s*\w+',
    r'surface\s*(?:pro|laptop|go)?(?:\s*\d+)?',
    r'galaxy\s*watch\s*\d*',
    r'apple\s*watch\s*(?:series\s*)?\d*',
    r'find\s*x\d+\s*(?:pro|ultra)?',
    r'oppo\s*reno\s*\d+',
    r'poco\s*[a-z]\d+\s*(?:pro|ultra)?',
    r'(?:rtx|gtx)\s*\d+\w*',
]


# ── Hàm trích xuất tên sản phẩm ──────────────────────────────────
def extract_product_names(text: str) -> list[str]:
    """Tìm tên sản phẩm cụ thể được nhắc đến"""
    text_lower = text.lower()
    found = []
    for pattern in PRODUCT_NAME_PATTERNS:
        matches = re.findall(pattern, text_lower)
        found.extend(m.strip() for m in matches if m.strip())
    return list(set(found))


# ── Hàm trích xuất cảm nhận ──────────────────────────────────────
def extract_sentiment(text: str) -> Optional[str]:
    text_lower = text.lower()
    for sentiment, keywords in SENTIMENT_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return sentiment
    return None


# ── Hàm trích xuất thương hiệu ──────────────────────────────────
def extract_brands(text: str) -> list[str]:
    text_lower = text.lower()
    found = []

    # Tìm thương hiệu chính
    for brand, aliases in BRAND_MAP.items():
        if any(alias in text_lower for alias in aliases):
            found.append(brand)

    # Tìm từ viết tắt
    for alias, brand in BRAND_ALIASES.items():
        if f" {alias} " in f" {text_lower} " and brand not in found:
            found.append(brand)

    return list(set(found))


# ── Hàm trích xuất ngân sách ────────────────────────────────────
def extract_budget(text: str) -> tuple[Optional[int], Optional[int]]:
    """
    Trích xuất ngân sách từ text tiếng Việt.
    Hỗ trợ:
      "20 triệu", "20tr", "20m", "20,5 triệu"
      "10-20 triệu", "từ 10 đến 20 triệu"
      "dưới 15 triệu", "tầm 10 triệu"
      "trên 30 triệu"
      "20 củ" (củ = triệu, dân gian)
    """
    text_lower = text.lower()
    budget_min = None
    budget_max = None

    def to_vnd(value: float, unit: str) -> int:
        unit = unit.lower().strip()
        if "tỷ" in unit or "ty" in unit:
            return int(value * 1_000_000_000)
        elif "triệu" in unit or "tr" in unit or "củ" in unit or " m" in f" {unit}":
            return int(value * 1_000_000)
        elif "nghìn" in unit or "k" in unit:
            return int(value * 1_000)
        return int(value)

    # Khoảng: "10-20 triệu", "từ 10 đến 20 triệu", "10tr đến 20tr"
    range_patterns = [
        r'(?:từ\s+)?(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|củ|nghìn|k)?\s*(?:[-–]|đến|tới)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|củ|nghìn|k)?',
    ]
    for pat in range_patterns:
        m = re.search(pat, text_lower)
        if m:
            v1 = float(m.group(1).replace(',', '.'))
            unit1 = m.group(2) or "triệu"
            v2 = float(m.group(3).replace(',', '.'))
            unit2 = m.group(4) or unit1
            budget_min = to_vnd(v1, unit1)
            budget_max = to_vnd(v2, unit2)
            return budget_min, budget_max

    # Dưới / không quá / tối đa / khoảng / tầm / chỉ khoảng
    under_pattern = r'(?:dưới|không quá|tối đa|khoảng|tầm|chỉ(?:\s+khoảng)?|ngân sách|budget)\s*(?:là\s+)?(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|củ|nghìn|k)?'
    m = re.search(under_pattern, text_lower)
    if m:
        v = float(m.group(1).replace(',', '.'))
        unit = m.group(2) or "triệu"
        budget_max = to_vnd(v, unit)
        budget_min = int(budget_max * 0.6)
        return budget_min, budget_max

    # Trên / tối thiểu / ít nhất
    over_pattern = r'(?:trên|tối thiểu|ít nhất)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|củ|nghìn|k)?'
    m = re.search(over_pattern, text_lower)
    if m:
        v = float(m.group(1).replace(',', '.'))
        unit = m.group(2) or "triệu"
        budget_min = to_vnd(v, unit)
        return budget_min, None

    # Số đứng một mình + đơn vị → giả định là max budget
    solo_pattern = r'(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|củ)'
    m = re.search(solo_pattern, text_lower)
    if m:
        v = float(m.group(1).replace(',', '.'))
        unit = m.group(2)
        budget_max = to_vnd(v, unit)
        budget_min = int(budget_max * 0.6)
        return budget_min, budget_max

    return None, None


# ── Hàm phát hiện intent ─────────────────────────────────────────
def detect_intent(text: str, has_budget: bool, has_category: bool, has_brands: bool) -> str:
    text_lower = text.lower()

    # Chào hỏi / hội thoại xã giao
    greet_words = ["xin chào", "hello", "hi", "chào", "hey", "alo",
                   "bạn là ai", "bạn tên gì", "bạn có thể", "cảm ơn", "thank", "bye"]
    if any(w in text_lower for w in greet_words) and not has_category and not has_brands:
        return "greeting"

    # So sánh
    compare_words = ["so sánh", "compare", "khác nhau", "khác gì", "tốt hơn",
                     "nào tốt", "nên chọn cái nào", "hay là", "hay nên", "chọn cái nào"]
    if any(w in text_lower for w in compare_words):
        return "comparison"

    # Hỏi về sản phẩm cụ thể
    inquiry_words = ["thông số", "cấu hình", "tính năng", "specs", "review",
                     "đánh giá", "chi tiết", "thông tin về", "giới thiệu về",
                     "mô tả", "cho tôi biết về", "tell me about"]
    if any(w in text_lower for w in inquiry_words):
        return "product_inquiry"

    # Tìm theo ngân sách
    if has_budget:
        return "budget_search"

    # Gợi ý / tư vấn
    recommend_words = [
        "tư vấn", "gợi ý", "recommend", "nên mua", "chọn gì", "mua gì",
        "phù hợp", "nên mua cái gì", "cần mua", "đang cần",
        "muốn mua", "định mua", "mua tặng", "chọn", "nên chọn",
        "cho tôi xem", "giới thiệu", "liệt kê", "có những gì",
        "có gì", "có loại nào", "có sản phẩm nào", "dòng nào",
        "loại nào", "cái nào", "model nào", "máy nào", "điện thoại nào",
    ]
    if any(w in text_lower for w in recommend_words):
        return "recommendation"

    # Tìm kiếm chung với danh mục/thương hiệu
    if has_category or has_brands:
        return "recommendation"

    return "general"


# ── Hàm chính: parse intent ─────────────────────────────────────
def parse_intent(user_message: str) -> ParsedIntent:
    text_lower = user_message.lower()

    # 1. Category
    detected_category = None
    detected_category_db = None
    for slug, keywords in CATEGORY_MAP.items():
        if any(kw in text_lower for kw in keywords):
            detected_category = keywords[0]     # Tên tiếng Việt đầu tiên
            detected_category_db = slug         # Slug tiếng Anh
            break

    # 2. Budget
    budget_min, budget_max = extract_budget(user_message)
    has_budget = budget_min is not None or budget_max is not None

    # 3. Brands
    detected_brands = extract_brands(user_message)

    # 4. Purpose (dùng word boundary cho từ ngắn để tránh 'ai' khớp nhầm trong 'tai nghe')
    detected_purpose = None
    for purpose_key, keywords in PURPOSE_MAP.items():
        matched = False
        for kw in keywords:
            if len(kw) <= 3:
                if re.search(r'(?:\b|^|\s)' + re.escape(kw) + r'(?:\b|$|\s)', text_lower):
                    matched = True
                    break
            elif kw in text_lower:
                matched = True
                break
        if matched:
            detected_purpose = purpose_key     # Dùng key chuẩn
            break

    # 5. Product names
    product_names = extract_product_names(user_message)

    # 6. Sentiment
    sentiment = extract_sentiment(user_message)

    # 7. Intent (sau khi có đủ context)
    intent = detect_intent(
        user_message,
        has_budget=has_budget,
        has_category=detected_category is not None,
        has_brands=len(detected_brands) > 0,
    )

    # 8. Keywords — chỉ giữ các từ quan trọng, bỏ stop words tiếng Việt
    stop_words = {
        "tôi", "mình", "bạn", "cần", "muốn", "mua", "một", "cái",
        "cho", "để", "với", "và", "có", "là", "của", "này", "đó",
        "thì", "đang", "rất", "nên", "được", "những", "các", "nhiều",
        "ít", "lắm", "quá", "hay", "hoặc", "vì", "khi", "đã", "sẽ",
        "mà", "nếu", "thế", "vậy", "nhé", "nha", "nhá", "ạ", "ơi",
        "tìm", "kiếm", "hỏi", "tư", "vấn", "gợi", "giới", "thiệu",
        "xem", "nhìn", "hiện", "tại", "đang", "dùng", "sử", "dụng",
        "hệ", "thống", "cửa", "hàng", "shop", "store",
    }
    words = re.findall(r'\b[\wÀ-ỹ]{3,}\b', text_lower)
    keywords_clean = [w for w in words if w not in stop_words and not w.isdigit()][:10]

    return ParsedIntent(
        intent=intent,
        category=detected_category,
        category_db=detected_category_db,
        budget_min=budget_min,
        budget_max=budget_max,
        keywords=keywords_clean,
        purpose=detected_purpose,
        brands=detected_brands,
        product_names=product_names,
        sentiment=sentiment,
    )
