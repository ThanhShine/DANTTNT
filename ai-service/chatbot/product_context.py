"""
Product Context Builder Module
Ensures the LLM ONLY answers based on REAL products from MySQL.
Strictly prevents hallucinations and fabricated products.
"""

from typing import List, Dict, Any, Optional


def format_currency_vnd(amount: Any) -> str:
    """Format numbers into Vietnamese currency representation, e.g. 8.500.000 VNĐ"""
    try:
        val = float(amount)
        return f"{val:,.0f} VNĐ".replace(",", ".")
    except (ValueError, TypeError):
        return f"{amount} VNĐ"


def build_product_context_text(products: List[Dict[str, Any]]) -> str:
    """
    Format real products from MySQL into a clear, detailed context block for Qwen.
    Qwen uses this context to cite exact prices, specifications, and stock status.
    """
    if not products:
        return (
            "THÔNG TIN SẢN PHẨM TRONG KHO:\n"
            "Hiện tại hệ thống không tìm thấy sản phẩm nào phù hợp chính xác với yêu cầu của khách hàng.\n"
            "Hãy thông báo lịch sự cho khách rằng cửa hàng chưa có mẫu này và gợi ý họ điều chỉnh tiêu chí (giá, thương hiệu, hoặc dòng máy)."
        )

    context_lines = [
        "DANH SÁCH SẢN PHẨM THỰC TẾ TRONG HỆ THỐNG CỦA CỬA HÀNG (CHỈ TƯ VẤN DỰA TRÊN DANH SÁCH NÀY, TUYỆT ĐỐI KHÔNG TỰ BỊA RA SẢN PHẨM KHÁC):",
        "---"
    ]

    for idx, p in enumerate(products, 1):
        pid = p.get("id")
        name = p.get("name", "Sản phẩm")
        brand = p.get("brand_name") or p.get("brand") or "Chính hãng"
        category = p.get("category_name") or p.get("category") or "Thiết bị"
        price = format_currency_vnd(p.get("price", 0))
        old_price = format_currency_vnd(p.get("original_price")) if p.get("original_price") else None
        stock = p.get("stock_quantity", 0)
        rating = p.get("rating_average") or p.get("rating", 5.0)
        sold = p.get("total_sold", 0)
        desc = p.get("short_description") or p.get("description") or ""

        stock_status = f"Còn {stock} sản phẩm trong kho" if stock > 0 else "ĐÃ HẾT HÀNG (tạm thời)"

        # Specifications formatting
        specs = p.get("specifications", {})
        spec_summary = []
        if isinstance(specs, dict):
            for k, v in specs.items():
                if v:
                    spec_summary.append(f"{k}: {v}")
        specs_str = "; ".join(spec_summary) if spec_summary else "Đang cập nhật"

        card = [
            f"[{idx}] ID: {pid} | TÊN: {name}",
            f"   - Thương hiệu: {brand} | Danh mục: {category}",
            f"   - Giá bán hiện tại: {price}" + (f" (Giá gốc: {old_price})" if old_price else ""),
            f"   - Tình trạng kho: {stock_status}",
            f"   - Đánh giá: {rating}/5⭐ | Đã bán: {sold}",
            f"   - Thông số kỹ thuật: {specs_str}",
        ]
        if desc:
            clean_desc = desc.replace("\n", " ")[:200]
            card.append(f"   - Mô tả nổi bật: {clean_desc}")

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
