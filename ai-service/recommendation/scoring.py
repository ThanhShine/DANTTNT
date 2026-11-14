"""
Scoring module for personalized recommendation system.
Combines:
1. Current requirement score (Highest priority #1)
2. Short-term chat context score (Priority #2)
3. Long-term memory & preference summary score (Priority #3, weighted by confidence)
4. User behavior score (Views, searches, cart items)
5. Purchase preference score (Previous purchases)
6. Product quality & availability score (Ratings, sales, stock)
"""

from typing import Any, Dict, List, Optional


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
    curr_brand = intent_data.get("brand")
    curr_cat = intent_data.get("category")
    curr_features = intent_data.get("features", {})

    has_explicit_budget = curr_budget is not None and curr_budget > 0
    has_explicit_brand = curr_brand is not None and len(curr_brand) > 0
    has_explicit_cat = curr_cat is not None and len(curr_cat) > 0
    has_explicit_features = len(curr_features) > 0

    # 1.1 Kiểm tra thương hiệu trong yêu cầu hiện tại
    if has_explicit_brand:
        curr_b_lower = curr_brand.lower()
        if curr_b_lower in brand or curr_b_lower in name:
            current_req_score += 50.0  # Điểm rất cao cho thương hiệu khách vừa yêu cầu
        else:
            current_req_score -= 30.0  # Phạt nếu không khớp thương hiệu khách vừa chỉ định

    # 1.2 Kiểm tra ngân sách trong yêu cầu hiện tại
    if has_explicit_budget:
        if price <= curr_budget:
            ratio = price / curr_budget
            if ratio >= 0.7:
                current_req_score += 40.0
            elif ratio >= 0.4:
                current_req_score += 30.0
            else:
                current_req_score += 20.0
        else:
            over_pct = (price - curr_budget) / curr_budget
            if over_pct <= 0.15:
                current_req_score += 10.0
            else:
                current_req_score -= 35.0

    # 1.3 Kiểm tra danh mục trong yêu cầu hiện tại
    if has_explicit_cat:
        cat_lower = curr_cat.lower()
        if cat_lower in cat_name or cat_lower in name:
            current_req_score += 35.0
        else:
            current_req_score -= 20.0

    # 1.4 Kiểm tra tính năng trong yêu cầu hiện tại
    if curr_features.get("camera") == "high":
        if any(k in desc or k in name for k in ["camera", "50mp", "200mp", "ống kính", "chụp đêm", "pro"]):
            current_req_score += 25.0
    if curr_features.get("gaming") == "high":
        if any(k in desc or k in name for k in ["gaming", "snapdragon", "rtx", "120hz", "144hz", "dimensity", "m4", "m3"]):
            current_req_score += 25.0
    if curr_features.get("battery") == "high":
        if any(k in desc or k in name for k in ["5000mah", "6000mah", "pin trâu", "sạc nhanh"]):
            current_req_score += 20.0
    if curr_features.get("office") == "high":
        if any(k in desc or k in name for k in ["mỏng nhẹ", "văn phòng", "ultrabook", "sinh viên"]):
            current_req_score += 20.0

    total_score += current_req_score

    # ── 2. LONG-TERM MEMORY & PREFERENCE SCORE (ƯU TIÊN SỐ 3) ──
    # QUY TẮC: Chỉ áp dụng sở thích dài hạn nếu yêu cầu hiện tại KHÔNG nói ngược lại
    memory_score: float = 0.0

    # Parse memory map
    mem_dict: Dict[str, Any] = {}
    if user_memories:
        for m in user_memories:
            k = m.get("memory_key")
            v = m.get("memory_value")
            c = float(m.get("confidence", 0.5))
            mem_dict[k] = {"value": v, "confidence": c, "type": m.get("memory_type")}

    # 2.1 Brand memory
    # Nếu user không chỉ định brand trong câu hỏi hiện tại -> Lấy từ memory
    if not has_explicit_brand:
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
                memory_score += 35.0 * brand_conf

    # 2.2 Budget memory
    # Nếu user không nói giá trong câu hỏi hiện tại -> Lấy từ memory
    if not has_explicit_budget:
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
                ratio = price / pref_budget
                if ratio >= 0.6:
                    memory_score += 30.0 * budget_conf
                else:
                    memory_score += 15.0 * budget_conf
            else:
                over_pct = (price - pref_budget) / pref_budget
                if over_pct > 0.2:
                    memory_score -= 20.0 * budget_conf

    # 2.3 Feature memories
    # Nếu user không chỉ định tính năng trong câu hỏi hiện tại -> Lấy từ memory
    for feat in ["camera", "gaming", "battery", "office"]:
        if feat not in curr_features:
            mem_key = f"feature_{feat}"
            if mem_key in mem_dict and mem_dict[mem_key]["value"] == "high":
                f_conf = mem_dict[mem_key]["confidence"]
                if feat == "camera" and any(k in desc or k in name for k in ["camera", "50mp", "ống kính", "pro"]):
                    memory_score += 20.0 * f_conf
                elif feat == "gaming" and any(k in desc or k in name for k in ["gaming", "snapdragon", "rtx", "120hz"]):
                    memory_score += 20.0 * f_conf
                elif feat == "battery" and any(k in desc or k in name for k in ["5000mah", "pin", "sạc"]):
                    memory_score += 15.0 * f_conf
                elif feat == "office" and any(k in desc or k in name for k in ["mỏng nhẹ", "văn phòng"]):
                    memory_score += 15.0 * f_conf

    # 2.4 Dislike memories (Phạt điểm nếu sản phẩm chứa đặc điểm khách hàng ghét)
    for k, v in mem_dict.items():
        if v.get("type") == "dislike":
            dis_val = str(v.get("value", "")).lower()
            if dis_val in brand or dis_val in name or dis_val in desc:
                memory_score -= 30.0 * v.get("confidence", 0.6)

    total_score += memory_score

    # ── 3. USER BEHAVIOR SCORE ──
    behavior_score: float = 0.0
    if user_interactions:
        cart_ids = user_interactions.get("cart_product_ids", [])
        if p_id in cart_ids:
            behavior_score += 25.0

        viewed_ids = user_interactions.get("viewed_product_ids", [])
        if p_id in viewed_ids:
            behavior_score += 15.0

        search_kws = user_interactions.get("search_keywords", [])
        for kw in search_kws:
            kw_low = kw.lower()
            if kw_low in name or kw_low in brand:
                behavior_score += 10.0
                break

    total_score += behavior_score

    # ── 4. PURCHASE PREFERENCE SCORE ──
    purchase_score: float = 0.0
    if user_interactions:
        purchased_ids = user_interactions.get("purchased_product_ids", [])
        if p_id in purchased_ids:
            # Đã từng mua sản phẩm này -> Gợi ý mua lại hoặc phụ kiện tương thích
            purchase_score += 10.0
        
        # Nếu cùng thương hiệu với món đã từng mua
        purchased_details = user_interactions.get("purchased_details", [])
        for p_desc in purchased_details:
            if brand and brand in p_desc.lower():
                purchase_score += 8.0
                break

    total_score += purchase_score

    return total_score


# Backward compatibility alias
calculate_product_score = calculate_personalized_product_score
