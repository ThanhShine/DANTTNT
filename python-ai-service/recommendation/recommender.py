"""
Recommender Engine
Thực hiện xếp hạng, lọc thông minh và chọn lọc các sản phẩm tối ưu nhất cho khách hàng.
Hỗ trợ chấm điểm cá nhân hóa đa tầng (Current Request, Memory, Behavior, Purchase History)
và loại bỏ sản phẩm nhiễu (khác danh mục / không liên quan) khi đã có sản phẩm khớp trực tiếp.
"""

from typing import Any, Dict, List, Optional
from .scoring import (
    calculate_personalized_product_score,
    is_category_match,
    is_brand_match,
    is_product_keyword_match,
)

# Backward compatibility alias
calculate_product_score = calculate_personalized_product_score


def recommend_products(
    candidates: List[Dict[str, Any]],
    intent_data: Dict[str, Any],
    user_memories: Optional[List[Dict[str, Any]]] = None,
    preference_summary: Optional[Dict[str, Any]] = None,
    user_interactions: Optional[Dict[str, Any]] = None,
    top_k: int = 4,
) -> List[Dict[str, Any]]:
    """
    Chấm điểm, phân loại mức độ khớp (match_type) và chọn lọc danh sách sản phẩm phù hợp nhất.
    Quy tắc thông minh:
    1. Nếu người dùng hỏi đích danh sản phẩm/model (product_keywords, ví dụ "AirPod", "Vivobook", "iPhone 16 Pro Max")
       và trong kho có sản phẩm khớp -> CHỈ trả về các sản phẩm khớp từ khóa đó (kèm tối đa 1 sản phẩm cùng danh mục nếu cần so sánh),
       TUYỆT ĐỐI KHÔNG trộn lẫn sản phẩm khác danh mục (như củ sạc, loa khi đang hỏi tai nghe).
    2. Nếu người dùng hỏi theo Danh mục + Thương hiệu (ví dụ "tai nghe Apple", "laptop MSI", "loa JBL"):
       - Nếu có sản phẩm khớp cả Danh mục + Thương hiệu -> Chỉ trả về các sản phẩm đó.
       - Nếu không có thương hiệu đó trong danh mục (ví dụ "laptop Apple" hoặc "điện thoại Samsung" chưa có trong kho) ->
         Trả về các sản phẩm CÙNG DANH MỤC (ví dụ laptop HP/Asus/MSI) và gắn cờ `match_type = "alternative_brand"` để AI giải thích rõ.
    3. Nếu người dùng hỏi theo Ngân sách (ví dụ "laptop lập trình dưới 20 triệu"):
       - Ưu tiên số 1: Sản phẩm đúng danh mục và nằm trong ngân sách (`match_type = "exact_match"`).
       - Ưu tiên số 2: Sản phẩm đúng danh mục và vượt ngân sách nhẹ <= 15% (`match_type = "close_budget"`).
       - Không trả về các sản phẩm vượt ngân sách quá xa (> 30%) nếu đã có sản phẩm trong tầm giá.
    """
    if not candidates:
        return []

    target_cat = intent_data.get("category")
    target_brand = intent_data.get("brand")
    all_brands = intent_data.get("all_brands") or ([] if not target_brand else [target_brand])
    product_kws = intent_data.get("product_keywords") or []
    budget = intent_data.get("budget") or intent_data.get("budget_max")
    budget_min = intent_data.get("budget_min")
    budget_mode = intent_data.get("budget_mode") or "under"
    is_comparison = bool(intent_data.get("is_comparison"))

    scored_items: List[Dict[str, Any]] = []
    for p in candidates:
        score = calculate_personalized_product_score(
            product=p,
            intent_data=intent_data,
            user_memories=user_memories,
            preference_summary=preference_summary,
            user_interactions=user_interactions
        )
        price = float(p.get("price") or p.get("sale_price") or p.get("base_price") or 0.0)
        cat_ok = is_category_match(p, target_cat)
        brand_ok = is_brand_match(p, target_brand, all_brands)
        kw_ok = is_product_keyword_match(p, product_kws)

        # Kiểm tra độ khớp ngân sách
        budget_ok = True
        close_budget = False
        if budget_mode == "range" and budget_min and budget:
            budget_ok = (budget_min <= price <= budget)
            close_budget = not budget_ok and (budget_min * 0.85 <= price <= budget * 1.15)
        elif budget_mode == "over" and budget_min:
            budget_ok = (price >= budget_min)
            close_budget = not budget_ok and (price >= budget_min * 0.85)
        elif budget and budget > 0:
            budget_ok = (price <= budget)
            close_budget = not budget_ok and (price <= budget * 1.15)

        item_copy = dict(p)
        item_copy["recommendation_score"] = score
        item_copy["_cat_ok"] = cat_ok
        item_copy["_brand_ok"] = brand_ok
        item_copy["_kw_ok"] = kw_ok
        item_copy["_budget_ok"] = budget_ok
        item_copy["_close_budget"] = close_budget

        # Gắn nhãn match_type và match_note phục vụ LLM Context
        if cat_ok and brand_ok and kw_ok and budget_ok:
            item_copy["match_type"] = "exact_match"
            item_copy["match_note"] = "KHỚP CHÍNH XÁC YÊU CẦU - ĐANG CÓ SẴN TRONG KHO"
        elif cat_ok and brand_ok and kw_ok and close_budget:
            item_copy["match_type"] = "close_budget"
            item_copy["match_note"] = "KHỚP SẢN PHẨM (GIÁ NHỈNH HƠN NHẸ SO VỚI NGÂN SÁCH)"
        elif cat_ok and budget_ok and not brand_ok:
            item_copy["match_type"] = "alternative_brand"
            item_copy["match_note"] = "SẢN PHẨM CÙNG DANH MỤC & TRONG TẦM GIÁ (THƯƠNG HIỆU THAY THẾ)"
        elif cat_ok and close_budget:
            item_copy["match_type"] = "close_budget"
            item_copy["match_note"] = "GỢI Ý CÙNG DANH MỤC (GIÁ TIỆM CẬN NGÂN SÁCH)"
        elif cat_ok:
            item_copy["match_type"] = "same_category"
            item_copy["match_note"] = "SẢN PHẨM CÙNG DANH MỤC THAM KHẢO THÊM"
        else:
            item_copy["match_type"] = "other"
            item_copy["match_note"] = "SẢN PHẨM KHÁC THAM KHẢO"

        scored_items.append(item_copy)

    # Sắp xếp giảm dần theo điểm số
    scored_items.sort(key=lambda x: x["recommendation_score"], reverse=True)

    # ── BƯỚC LỌC THÔNG MINH (SMART FILTERING) ──

    # Trường hợp 1: Khách hỏi đích danh từ khóa sản phẩm/model (VD: "AirPod", "Vivobook", "iPhone 16")
    if product_kws:
        kw_matches = [x for x in scored_items if x["_kw_ok"] and (x["_cat_ok"] if target_cat else True)]
        if kw_matches:
            # Nếu là câu hỏi so sánh nhiều mẫu, trả về tất cả các mẫu khớp từ khóa
            if is_comparison or len(kw_matches) >= 2:
                return kw_matches[:top_k]
            # Nếu chỉ có 1 sản phẩm khớp chính xác (VD: AirPods 5), chỉ trả về đúng sản phẩm đó!
            return kw_matches[:top_k]

    # Trường hợp 2: Khách chỉ định Danh mục cụ thể (VD: headphone, laptop, phone, speaker, charger)
    if target_cat:
        cat_matches = [x for x in scored_items if x["_cat_ok"]]
        if not cat_matches:
            # Danh mục này hoàn toàn chưa có hàng trong kho (VD: smartwatch, tablet, case)
            return []

        # 2a. Nếu khách có chỉ định cả Thương hiệu (VD: "tai nghe Apple", "điện thoại iPhone", "laptop MSI")
        if all_brands:
            brand_cat_matches = [x for x in cat_matches if x["_brand_ok"]]
            if brand_cat_matches:
                # Nếu có thêm điều kiện ngân sách
                if budget and budget > 0:
                    in_budget = [x for x in brand_cat_matches if x["_budget_ok"] or x["_close_budget"]]
                    if in_budget:
                        return in_budget[:top_k]
                return brand_cat_matches[:top_k]
            else:
                # Thương hiệu khách hỏi không có trong danh mục này -> Trả về các mẫu tốt nhất cùng danh mục
                if budget and budget > 0:
                    in_budget_cat = [x for x in cat_matches if x["_budget_ok"] or x["_close_budget"]]
                    if in_budget_cat:
                        return in_budget_cat[:top_k]
                return cat_matches[:top_k]

        # 2b. Nếu khách chỉ định Danh mục + Ngân sách (VD: "Laptop lập trình dưới 20 triệu")
        if budget and budget > 0:
            exact_and_close = [x for x in cat_matches if x["_budget_ok"] or x["_close_budget"]]
            if exact_and_close:
                return exact_and_close[:top_k]
            # Nếu tất cả sản phẩm trong danh mục đều vượt ngân sách, lấy tối đa 2 mẫu có giá gần nhất
            cat_sorted_by_price = sorted(
                cat_matches,
                key=lambda x: abs(float(x.get("price") or 0) - budget)
            )
            for item in cat_sorted_by_price:
                item["match_type"] = "over_budget_alternative"
                item["match_note"] = "MẪU GẦN NGÂN SÁCH NHẤT HIỆN CÓ TRONG KHO"
            return cat_sorted_by_price[:min(2, top_k)]

        # 2c. Chỉ hỏi theo Danh mục (VD: "Có những mẫu tai nghe nào?", "Tư vấn loa bluetooth")
        return cat_matches[:top_k]

    # Trường hợp 3: Khách chỉ hỏi theo Thương hiệu mà không nêu danh mục (VD: "Sản phẩm Apple", "Đồ của Anker")
    if all_brands:
        brand_matches = [x for x in scored_items if x["_brand_ok"]]
        if brand_matches:
            if budget and budget > 0:
                in_b = [x for x in brand_matches if x["_budget_ok"] or x["_close_budget"]]
                if in_b:
                    return in_b[:top_k]
            return brand_matches[:top_k]

    # Trường hợp 4: Khách chỉ hỏi theo Ngân sách hoặc Nhu cầu chung
    if budget and budget > 0:
        budget_matches = [x for x in scored_items if x["_budget_ok"] or x["_close_budget"]]
        if budget_matches:
            return budget_matches[:top_k]

    return scored_items[:top_k]
