"""
Memory Extractor Module
Phân tích câu nói của người dùng sau mỗi lượt hội thoại để trích xuất các đơn vị thông tin
đáng nhớ dài hạn (Long-term memories):
- brand (thương hiệu yêu thích hoặc muốn đổi)
- budget (ngân sách thường mua / giới hạn giá)
- feature (tính năng ưu tiên: camera, gaming, battery, screen, weight,...)
- dislike (điều không thích / nhược điểm muốn tránh)
- category (dòng sản phẩm hay quan tâm)
- preference (sở thích tổng quát)
"""

import re
from typing import List, Dict, Any, Optional
from chatbot.intent import extract_budget, extract_features, extract_brand, extract_category, BRAND_KEYWORDS, CATEGORY_KEYWORDS


DISLIKE_PATTERNS = [
    (r'(?:không thích|rất ghét|tránh|đừng lấy|không muốn)\s+(?:máy\s+)?(quá nặng|nặng|dày|nóng|nhanh hết pin|màn bé|màu hồng|màu mè)', 'disliked_characteristic'),
    (r'(?:không thích|ghét|không ưng)\s+thương hiệu\s+([a-zA-Z0-9\s]+)', 'disliked_brand'),
    (r'(?:không thích|không ưng|chê)\s+(samsung|iphone|apple|xiaomi|oppo|asus|dell|hp|lenovo|acer)', 'disliked_brand'),
]

PREFERENCE_STRONG_PATTERNS = [
    (r'(?:tôi|mình|em|anh|chị)?\s*(?:rất thích|thích nhất|chuộng|fan|ưu tiên|trung thành với)\s+([a-zA-Z0-9\s]+)', 'preferred_brand'),
    (r'(?:bây giờ|dạo này|hiện tại|muốn đổi sang|muốn thử)\s+(?:dùng\s+)?(iphone|samsung|xiaomi|macbook|dell|asus|hp|lenovo)', 'switch_brand'),
]


def extract_memories_from_message(message: str) -> List[Dict[str, Any]]:
    """
    Trích xuất danh sách các memory candidate từ câu nói của người dùng.
    Mỗi memory có cấu trúc:
    {
        "memory_type": "brand" | "budget" | "feature" | "dislike" | "category" | "preference",
        "memory_key": str,
        "memory_value": str,
        "confidence": float (0.4 - 0.8),
        "source": "chat_extraction",
        "is_negation": bool
    }
    """
    memories: List[Dict[str, Any]] = []
    text_lower = message.lower().strip()

    # 1. Trích xuất Brand preference
    # Kiểm tra chuyển đổi sở thích: "Bây giờ tôi muốn thử iPhone"
    switch_match = re.search(r'(?:bây giờ|dạo này|hiện tại|nay|muốn đổi sang|muốn thử|tính mua)\s+(?:dùng\s+)?(iphone|samsung|xiaomi|macbook|dell|asus|hp|lenovo|oppo|acer)', text_lower)
    if switch_match:
        brand_raw = switch_match.group(1).capitalize()
        # Chuẩn hóa iPhone -> Apple
        if brand_raw.lower() in ["iphone", "macbook", "ipad", "apple"]:
            brand_val = "Apple"
        else:
            brand_val = brand_raw
        memories.append({
            "memory_type": "brand",
            "memory_key": "preferred_brand",
            "memory_value": brand_val,
            "confidence": 0.75,
            "source": "chat_extraction",
            "is_switch": True
        })
    else:
        # Nhận diện: "Tôi thích Samsung", "Tôi rất thích thương hiệu Samsung", "Mình chuộng Xiaomi"
        for brand_name, kws in BRAND_KEYWORDS.items():
            pattern = r'(?:thích|chuộng|hay dùng|fan|mua của|chọn|yêu thích)\s+(?:thương hiệu\s+|dòng\s+|hãng\s+)?' + re.escape(brand_name.lower())
            if re.search(pattern, text_lower) or re.search(r'\b(?:thích|chuộng|fan)\b.*?\b' + re.escape(brand_name.lower()) + r'\b', text_lower):
                memories.append({
                    "memory_type": "brand",
                    "memory_key": "preferred_brand",
                    "memory_value": brand_name,
                    "confidence": 0.7,
                    "source": "chat_extraction",
                    "is_switch": False
                })
                break

    # 2. Trích xuất Dislike
    for pattern_regex, dislike_key in DISLIKE_PATTERNS:
        match = re.search(pattern_regex, text_lower)
        if match:
            dislike_val = match.group(1).strip().capitalize()
            memories.append({
                "memory_type": "dislike",
                "memory_key": dislike_key,
                "memory_value": dislike_val,
                "confidence": 0.7,
                "source": "chat_extraction"
            })
            break

    # 3. Trích xuất Ngân sách thường mua / giới hạn ngân sách
    # Nhận diện: "tôi thường mua dưới 10 triệu", "khoảng 8 triệu", "tầm 8tr"
    budget_val = extract_budget(message)
    if budget_val:
        # Nếu câu nói thể hiện thói quen hoặc ngân sách định kỳ
        is_habit = any(k in text_lower for k in [
            "thường", "hay mua", "tài chính của tôi", "túi tiền", "thu nhập", "tầm giá tôi muốn", "ngân sách của mình", "tôi có khoảng", "tôi có tầm"
        ])
        confidence = 0.75 if is_habit else 0.6
        memories.append({
            "memory_type": "budget",
            "memory_key": "preferred_budget_max",
            "memory_value": str(int(budget_val)),
            "confidence": confidence,
            "source": "chat_extraction"
        })

    # 4. Trích xuất Features ưu tiên
    features = extract_features(message)
    for feat_name, feat_level in features.items():
        if feat_level == "high" or any(k in text_lower for k in ["ưu tiên", "quan trọng", "cần nhất", "phải có"]):
            memories.append({
                "memory_type": "feature",
                "memory_key": f"feature_{feat_name}",
                "memory_value": "high",
                "confidence": 0.65,
                "source": "chat_extraction"
            })

    # 5. Trích xuất Category quan tâm
    category = extract_category(message)
    if category and any(k in text_lower for k in ["hay dùng", "cần mua", "muốn tìm", "thường mua"]):
        memories.append({
            "memory_type": "category",
            "memory_key": "preferred_category",
            "memory_value": category,
            "confidence": 0.6,
            "source": "chat_extraction"
        })

    return memories
