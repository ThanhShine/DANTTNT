"""
Scoring module for personalized recommendation system.
Combines:
1. Current requirement score (Highest priority #1: exact product keywords, category, brand, budget, features)
2. Short-term chat context score (Priority #2)
3. Long-term memory & preference summary score (Priority #3, weighted by confidence)
4. User behavior score (Views, searches, cart items)
5. Purchase preference score (Previous purchases)
6. Product quality & availability score (Ratings, sales, stock)
"""

from typing import Any, Dict, List, Optional


CATEGORY_VN_MATCHERS: Dict[str, List[str]] = {
    "phone": ["điện thoại", "dien-thoai", "smartphone", "iphone", "galaxy"],
    "laptop": ["laptop", "máy tính xách tay", "macbook", "notebook", "vivobook", "cyborg", "240r"],
    "tablet": ["máy tính bảng", "may-tinh-bang", "tablet", "ipad"],
    "headphone": ["tai nghe", "tai-nghe", "airpod", "wh1000", "chụp tai", "earbuds"],
    "speaker": ["loa", "loa-bluetooth", "loa bluetooth", "flip", "emberton"],
    "charger": ["sạc", "cáp", "sac-cap", "adapter", "anker", "ep-t2510n", "a121d"],
    "case": ["ốp lưng", "bao da", "op-lung-bao-da"],
    "smartwatch": ["đồng hồ", "dong-ho-thong-minh", "smartwatch", "watch"],
    "accessory": ["phụ kiện", "tai nghe", "loa", "sạc", "cáp", "ốp lưng", "đồng hồ", "chuột", "bàn phím"]
}


def is_category_match(product: Dict[str, Any], target_category: Optional[str]) -> bool:
    """Check if a product belongs to the canonical target_category."""
    if not target_category:
        return True
    cat_key = target_category.lower()
    cat_name = (product.get("category_name") or product.get("category") or "").lower()
    name = (product.get("name") or "").lower()
    slug = (product.get("slug") or "").lower()

    match_terms = CATEGORY_VN_MATCHERS.get(cat_key, [cat_key])

    # Prevent false positives like "sạc nhanh cho điện thoại" matching "phone" when its category_name is "Sạc & Cáp"
    if cat_key == "phone" and any(x in cat_name for x in ["sạc", "cáp", "tai nghe", "loa", "ốp lưng"]):
        return False
    if cat_key == "headphone" and any(x in cat_name for x in ["sạc", "cáp", "loa", "điện thoại", "laptop"]):
        return False
    if cat_key == "speaker" and any(x in cat_name for x in ["sạc", "cáp", "tai nghe", "điện thoại", "laptop"]):
        return False
    if cat_key == "charger" and any(x in cat_name for x in ["tai nghe", "loa", "điện thoại", "laptop"]):
        return False

    return any(term in cat_name or term in name or term in slug for term in match_terms)


def is_brand_match(product: Dict[str, Any], target_brand: Optional[str], all_brands: Optional[List[str]] = None) -> bool:
    """Check if a product matches the requested brand(s)."""
    brands_to_check = all_brands if (all_brands and len(all_brands) > 0) else ([target_brand] if target_brand else [])
    if not brands_to_check:
        return True

    p_brand = (product.get("brand_name") or product.get("brand") or "").lower()
    p_name = (product.get("name") or "").lower()

    for b in brands_to_check:
        if not b:
            continue
        b_low = b.lower()
        if b_low in p_brand or b_low in p_name:
            return True
        if b_low == "msi" and ("msi" in p_name or "mis" in p_brand):
            return True
        if b_low == "apple" and any(k in p_name for k in ["iphone", "ipad", "macbook", "airpod"]):
            return True
    return False


def is_product_keyword_match(product: Dict[str, Any], product_keywords: Optional[List[str]]) -> bool:
    """Check if a product matches any specific model/product keyword requested by the user."""
    if not product_keywords:
        return True

    p_name = (product.get("name") or "").lower()
    p_slug = (product.get("slug") or "").lower()
    p_desc = (product.get("short_description") or product.get("description") or "").lower()

    for kw in product_keywords:
        kw_low = kw.lower()
        # Special check for "iphone 16" vs "iphone 16 pro max"
        if kw_low == "iphone 16":
            if "iphone 16" in p_name and "pro" not in p_name:
                return True
        elif kw_low in p_name or kw_low in p_slug or kw_low in p_desc:
            return True
    return False


def calculate_personalized_product_score(
    product: Dict[str, Any],
    intent_data: Dict[str, Any],
    user_memories: Optional[List[Dict[str, Any]]] = None,
    preference_summary: Optional[Dict[str, Any]] = None,
    user_interactions: Optional[Dict[str, Any]] = None,
) -> float:
    """
    Tính điểm tổng hợp cá nhân hóa theo công thức:
    score = current_requirement_score
          + memory_preference_score
          + behavior_score
          + purchase_preference_score
          + product_quality_score
    """
    total_score: float = 0.0

    p_id = product.get("id")
    price = float(product.get("price") or product.get("sale_price") or product.get("base_price") or 0.0)
    brand = (product.get("brand_name") or product.get("brand") or "").lower()
    cat_name = (product.get("category_name") or product.get("category") or "").lower()
    name = (product.get("name") or "").lower()
    desc = (product.get("short_description") or product.get("description") or "").lower()
    specs = product.get("specifications") or {}
    specs_text = " ".join(f"{k} {v}" for k, v in specs.items()).lower() if isinstance(specs, dict) else str(specs).lower()
    full_text = f"{name} {cat_name} {brand} {desc} {specs_text}"

    stock = int(product.get("stock_quantity") or 0)
    rating = float(product.get("rating_average") or product.get("rating") or product.get("avg_rating") or 5.0)
    sold = int(product.get("total_sold") or 0)

    # ── 0. Trạng thái cơ bản & Tồn kho ──
    if stock <= 0:
        total_score -= 40.0
    else:
        total_score += 10.0

    # Chất lượng sản phẩm (Đánh giá & lượt bán)
    total_score += min(15.0, (rating - 3.0) * 7.0)
    if sold > 50:
        total_score += 5.0

    # ── 1. CURRENT REQUIREMENT SCORE (ƯU TIÊN SỐ 1 - SECTION 7) ──
    current_req_score: float = 0.0

    curr_budget = intent_data.get("budget") or intent_data.get("budget_max")
    curr_budget_min = intent_data.get("budget_min")
    curr_budget_mode = intent_data.get("budget_mode") or "under"
    curr_brand = intent_data.get("brand")
    curr_all_brands = intent_data.get("all_brands") or ([] if not curr_brand else [curr_brand])
    curr_cat = intent_data.get("category")
    curr_product_kws = intent_data.get("product_keywords") or []
    curr_features = intent_data.get("features", {})

    has_explicit_budget = (curr_budget is not None and curr_budget > 0) or (curr_budget_min is not None and curr_budget_min > 0)
    has_explicit_brand = len(curr_all_brands) > 0
    has_explicit_cat = curr_cat is not None and len(curr_cat) > 0
    has_explicit_kws = len(curr_product_kws) > 0

    # 1.0 Kiểm tra từ khóa model/sản phẩm cụ thể (Ví dụ: "airpod", "vivobook", "cyborg", "iphone 16 pro max")
    if has_explicit_kws:
        if is_product_keyword_match(product, curr_product_kws):
            current_req_score += 80.0
        else:
            current_req_score -= 45.0

    # 1.1 Kiểm tra danh mục trong yêu cầu hiện tại (Ánh xạ chuẩn sang tiếng Việt)
    if has_explicit_cat:
        if is_category_match(product, curr_cat):
            current_req_score += 45.0
        else:
            current_req_score -= 60.0

    # 1.2 Kiểm tra thương hiệu trong yêu cầu hiện tại
    if has_explicit_brand:
        if is_brand_match(product, curr_brand, curr_all_brands):
            current_req_score += 50.0
        else:
            current_req_score -= 35.0

    # 1.3 Kiểm tra ngân sách trong yêu cầu hiện tại
    if has_explicit_budget:
        if curr_budget_mode == "range" and curr_budget_min and curr_budget:
            if curr_budget_min <= price <= curr_budget:
                current_req_score += 45.0
            elif price < curr_budget_min and (curr_budget_min - price) / curr_budget_min <= 0.15:
                current_req_score += 15.0
            elif price > curr_budget and (price - curr_budget) / curr_budget <= 0.15:
                current_req_score += 15.0
            else:
                current_req_score -= 35.0
        elif curr_budget_mode == "over" and curr_budget_min:
            if price >= curr_budget_min:
                current_req_score += 40.0
            elif (curr_budget_min - price) / curr_budget_min <= 0.15:
                current_req_score += 15.0
            else:
                current_req_score -= 30.0
        elif curr_budget:
            # "under" or "around"
            if price <= curr_budget:
                ratio = price / curr_budget
                if ratio >= 0.65:
                    current_req_score += 45.0
                elif ratio >= 0.35:
                    current_req_score += 32.0
                else:
                    current_req_score += 18.0
            else:
                over_pct = (price - curr_budget) / curr_budget
                if over_pct <= 0.12:
                    # Rất sát ngân sách (ví dụ ngân sách 20tr, máy 20.99tr hoặc 21.29tr -> ~5-6%)
                    current_req_score += 20.0
                elif over_pct <= 0.25:
                    current_req_score += 5.0
                else:
                    current_req_score -= 40.0

    # 1.4 Kiểm tra tính năng chuyên biệt trong yêu cầu hiện tại
    if curr_features.get("programming") == "high":
        if any(k in full_text for k in ["16gb", "512gb", "core 5", "core i5", "core i7", "i5", "i7", "ssd", "core 3", "vivobook", "hp 240r", "cyborg"]):
            current_req_score += 28.0
        if "16gb" in full_text and "512gb" in full_text:
            current_req_score += 10.0

    if curr_features.get("camera") in ["high", "medium"]:
        if any(k in full_text for k in ["camera", "48mp", "50mp", "200mp", "ống kính", "chụp đêm", "pro", "iphone"]):
            current_req_score += 25.0

    if curr_features.get("gaming") in ["high", "medium"]:
        if any(k in full_text for k in ["gaming", "rtx", "144hz", "120hz", "cyborg", "i7", "i5", "pro max"]):
            current_req_score += 28.0

    if curr_features.get("battery") in ["high", "medium"]:
        if any(k in full_text for k in ["5000mah", "6000mah", "pin", "sạc nhanh", "pd", "45w", "25w", "pro max"]):
            current_req_score += 20.0

    if curr_features.get("office") == "high":
        if any(k in full_text for k in ["mỏng nhẹ", "văn phòng", "ultrabook", "sinh viên", "vivobook", "hp 240r", "14''", "14 inch"]):
            current_req_score += 25.0

    if curr_features.get("anc") == "high":
        if any(k in full_text for k in ["anc", "chống ồn", "wh1000", "airpods", "bluetooth", "ip57", "ip67", "jbl", "marshall"]):
            current_req_score += 25.0

    total_score += current_req_score

    # ── 2. LONG-TERM MEMORY & PREFERENCE SCORE (ƯU TIÊN SỐ 3) ──
    # QUY TẮC: Chỉ áp dụng sở thích dài hạn nếu yêu cầu hiện tại KHÔNG chỉ định danh mục/thương hiệu/ngân sách riêng
    memory_score: float = 0.0

    mem_dict: Dict[str, Any] = {}
    if user_memories:
        for m in user_memories:
            k = m.get("memory_key")
            v = m.get("memory_value")
            c = float(m.get("confidence", 0.5))
            mem_dict[k] = {"value": v, "confidence": c, "type": m.get("memory_type")}

    # 2.1 Brand memory (chỉ áp dụng khi người dùng không chỉ định brand VÀ không tìm một loại phụ kiện cụ thể khác)
    if not has_explicit_brand and not has_explicit_kws:
        pref_brand = None
        brand_conf = 0.5
        if "preferred_brand" in mem_dict:
            pref_brand = mem_dict["preferred_brand"]["value"]
            brand_conf = mem_dict["preferred_brand"]["confidence"]
        elif preference_summary and preference_summary.get("preferred_brands"):
            brands_list = preference_summary["preferred_brands"]
            if isinstance(brands_list, list) and len(brands_list) > 0:
                pref_brand = brands_list[0]
                brand_conf = 0.7

        if pref_brand:
            if pref_brand.lower() in brand or pref_brand.lower() in name:
                memory_score += 20.0 * brand_conf

    # 2.2 Budget memory (chỉ áp dụng khi người dùng không nói giá VÀ không hỏi đích danh tên sản phẩm)
    if not has_explicit_budget and not has_explicit_kws:
        pref_budget = None
        budget_conf = 0.5
        if "preferred_budget_max" in mem_dict:
            try:
                pref_budget = float(mem_dict["preferred_budget_max"]["value"])
                budget_conf = mem_dict["preferred_budget_max"]["confidence"]
            except Exception:
                pass
        elif preference_summary and preference_summary.get("price_max"):
            try:
                pref_budget = float(preference_summary["price_max"])
                budget_conf = 0.7
            except Exception:
                pass

        if pref_budget and pref_budget > 0:
            if price <= pref_budget:
                memory_score += 15.0 * budget_conf

    # 2.3 Dislike memories
    for k, v in mem_dict.items():
        if v.get("type") == "dislike":
            dis_val = str(v.get("value", "")).lower()
            if dis_val and (dis_val in brand or dis_val in name or dis_val in desc):
                memory_score -= 30.0 * v.get("confidence", 0.6)

    total_score += memory_score

    # ── 3. USER BEHAVIOR SCORE ──
    behavior_score: float = 0.0
    if user_interactions and not has_explicit_kws:
        cart_ids = user_interactions.get("cart_product_ids", [])
        if p_id in cart_ids:
            behavior_score += 12.0

        viewed_ids = user_interactions.get("viewed_product_ids", [])
        if p_id in viewed_ids:
            behavior_score += 8.0

        search_kws = user_interactions.get("search_keywords", [])
        for kw in search_kws:
            kw_low = kw.lower()
            if kw_low in name or kw_low in brand:
                behavior_score += 5.0
                break

    total_score += behavior_score

    # ── 4. PURCHASE PREFERENCE SCORE ──
    purchase_score: float = 0.0
    if user_interactions and not has_explicit_kws:
        purchased_ids = user_interactions.get("purchased_product_ids", [])
        if p_id in purchased_ids:
            purchase_score += 5.0

        purchased_details = user_interactions.get("purchased_details", [])
        for p_desc in purchased_details:
            if brand and brand in p_desc.lower():
                purchase_score += 4.0
                break

    total_score += purchase_score

    return total_score


# Backward compatibility alias
calculate_product_score = calculate_personalized_product_score
