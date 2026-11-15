"""
Product Context Builder Module
Ensures the LLM ONLY answers based on REAL products from MySQL.
Strictly prevents hallucinations, fabricated products, and false "out of stock / not available" claims.
"""

from typing import List, Dict, Any, Optional


def format_currency_vnd(amount: Any) -> str:
    """Format numbers into Vietnamese currency representation, e.g. 8.500.000 VNĐ"""
    try:
        val = float(amount)
        return f"{val:,.0f} VNĐ".replace(",", ".")
    except (ValueError, TypeError):
        return f"{amount} VNĐ"


def build_product_context_text(
    products: List[Dict[str, Any]],
    intent_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Format real products from MySQL into a clear, detailed context block for Qwen.
    Explicitly flags whether exact matches were found so the LLM never claims a product is missing when it is right there.
    """
    if not products:
        req_cat = intent_data.get("category") if intent_data else None
        req_brand = intent_data.get("brand") if intent_data else None
        detail_str = ""
        if req_cat or req_brand:
            detail_str = f" (Danh mục: {req_cat or 'bất kỳ'}, Thương hiệu: {req_brand or 'bất kỳ'})"
        return (
            "TRẠNG THÁI TÌM KIẾM TRONG KHO: KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP" + detail_str + ".\n"
            "CHỈ ĐẠO BẮT BUỘC CHO AI:\n"
            "- Hãy thông báo lịch sự rằng hiện tại cửa hàng chưa kinh doanh hoặc đang tạm hết dòng sản phẩm này.\n"
            "- TUYỆT ĐỐI KHÔNG TỰ BỊA RA TÊN SẢN PHẨM, MODEL HOẶC GIÁ BÁN NÀO KHÔNG CÓ TRONG DANH SÁCH (ví dụ: không được tự nêu Acer Swift, Lenovo Ideapad, MacBook, Galaxy S24... khi danh sách trống).\n"
            "- Gợi ý khách hàng tham khảo các dòng sản phẩm hiện có tại cửa hàng như: iPhone 15/16 series, Laptop Asus Vivobook / HP 240R / MSI Gaming Cyborg, Tai nghe AirPods 5 / Sony WH-1000XM6, Loa JBL Flip 7 / Marshall Emberton II, Sạc nhanh Anker / Samsung."
        )

    exact_matches = [p for p in products if p.get("match_type") == "exact_match"]
    close_matches = [p for p in products if p.get("match_type") == "close_budget"]
    alt_brand_matches = [p for p in products if p.get("match_type") == "alternative_brand"]

    context_lines = []

    if exact_matches:
        exact_names = ", ".join(f"\"{p.get('name')}\"" for p in exact_matches)
        context_lines.append(
            f"✅ TRẠNG THÁI KHO HÀNG: TÌM THẤY {len(exact_matches)} SẢN PHẨM KHỚP CHÍNH XÁC YÊU CẦU CỦA KHÁCH HÀNG ({exact_names}) ĐANG CÓ SẴN TRONG CỬA HÀNG!\n"
            f"⚠️ CHỈ ĐẠO BẮT BUỘC: Sản phẩm khách tìm ĐANG CÓ SẴN bên dưới. Bạn PHẢI khẳng định ngay từ câu đầu tiên là cửa hàng ĐANG CÓ SẴN sản phẩm này và tư vấn chi tiết. TUYỆT ĐỐI CẤM nói câu \"Hiện tại hệ thống chưa có sản phẩm...\" hoặc \"Cửa hàng không có...\"!"
        )
    elif alt_brand_matches:
        req_brand = (intent_data or {}).get("brand") or "đó"
        context_lines.append(
            f"ℹ️ TRẠNG THÁI KHO HÀNG: Thương hiệu \"{req_brand}\" hiện chưa có mẫu trong danh mục này, nhưng cửa hàng ĐANG CÓ SẴN {len(products)} sản phẩm cùng loại rất tốt bên dưới để thay thế.\n"
            f"⚠️ CHỈ ĐẠO BẮT BUỘC: Hãy thông báo nhẹ nhàng rằng thương hiệu {req_brand} hiện chưa có sẵn ở dòng này và giới thiệu ngay các mẫu thực tế bên dưới. TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm ngoài danh sách!"
        )
    elif close_matches:
        context_lines.append(
            f"ℹ️ TRẠNG THÁI KHO HÀNG: Tìm thấy {len(products)} sản phẩm thực tế trong kho có mức giá tiệm cận nhất với ngân sách của khách hàng.\n"
            f"⚠️ CHỈ ĐẠO BẮT BUỘC: Hãy giới thiệu trực tiếp các sản phẩm trong danh sách bên dưới và nêu rõ mức giá thực tế của từng mẫu. TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm ngoài danh sách!"
        )
    else:
        context_lines.append(
            f"✅ TRẠNG THÁI KHO HÀNG: Đã lọc ra {len(products)} sản phẩm thực tế phù hợp nhất trong cửa hàng.\n"
            f"⚠️ CHỈ ĐẠO BẮT BUỘC: CHỈ tư vấn dựa trên danh sách sản phẩm bên dưới, TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm khác!"
        )

    context_lines.append("---")

    for idx, p in enumerate(products, 1):
        pid = p.get("id")
        name = p.get("name", "Sản phẩm")
        brand = p.get("brand_name") or p.get("brand") or "Chính hãng"
        category = p.get("category_name") or p.get("category") or "Thiết bị"
        price = format_currency_vnd(p.get("price", 0))
        old_price = format_currency_vnd(p.get("original_price") or p.get("base_price")) if (p.get("original_price") or p.get("base_price")) else None
        stock = p.get("stock_quantity", 0)
        rating = p.get("rating_average") or p.get("rating") or p.get("avg_rating") or 5.0
        sold = p.get("total_sold", 0)
        desc = p.get("short_description") or p.get("description") or ""
        match_note = p.get("match_note") or "SẢN PHẨM TRONG KHO"

        stock_status = f"Còn {stock} sản phẩm trong kho (Sẵn hàng)" if stock > 0 else "ĐÃ HẾT HÀNG (tạm thời)"

        # Specifications formatting
        specs = p.get("specifications", {})
        spec_summary = []
        if isinstance(specs, dict):
            for k, v in specs.items():
                if v:
                    spec_summary.append(f"{k}: {v}")
        specs_str = "; ".join(spec_summary) if spec_summary else "Xem trong mô tả nổi bật"

        card = [
            f"[{idx}] TÊN SẢN PHẨM: {name}  --> [{match_note}]",
            f"   - Mã ID: {pid} | Thương hiệu: {brand} | Danh mục: {category}",
            f"   - Giá bán ưu đãi hiện tại: {price}" + (f" (Giá niêm yết: {old_price})" if old_price and old_price != price else ""),
            f"   - Tình trạng kho: {stock_status}",
            f"   - Đánh giá: {rating}/5⭐ | Đã bán: {sold}",
        ]
        if spec_summary:
            card.append(f"   - Thông số kỹ thuật: {specs_str}")
        if desc:
            clean_desc = desc.replace("\n", " ")[:280]
            card.append(f"   - Đặc điểm & Cấu hình nổi bật: {clean_desc}")

        context_lines.append("\n".join(card))
        context_lines.append("---")

    return "\n".join(context_lines)


def sanitize_product_for_frontend(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare product data dictionary for client response JSON.
    Standardized keys so React components render seamlessly.
    """
    img = product.get("image_url") or product.get("image") or product.get("thumbnail") or product.get("thumbnail_url") or "/placeholder.png"
    price = float(product.get("price") or product.get("sale_price") or 0)
    original_price = float(product.get("original_price") or product.get("base_price") or 0) if (product.get("original_price") or product.get("base_price")) else None
    rating = float(product.get("rating_average") or product.get("rating") or product.get("avg_rating") or 5.0)

    return {
        "id": product.get("id"),
        "name": product.get("name"),
        "slug": product.get("slug") or f"product-{product.get('id')}",
        "price": price,
        "base_price": original_price if original_price else price,
        "sale_price": price if original_price and original_price > price else None,
        "original_price": original_price,
        "thumbnail_url": img,
        "image_url": img,
        "category_name": product.get("category_name") or product.get("category") or "",
        "brand_name": product.get("brand_name") or product.get("brand") or "",
        "stock_quantity": int(product.get("stock_quantity") or 0),
        "rating": rating,
        "avg_rating": rating,
        "total_reviews": int(product.get("review_count") or product.get("total_reviews") or 0),
        "total_sold": int(product.get("total_sold") or 0),
        "is_in_stock": int(product.get("stock_quantity") or 0) > 0,
    }
