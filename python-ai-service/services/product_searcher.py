"""
Product Searcher — Truy vấn sản phẩm từ MySQL theo điều kiện
Phiên bản nâng cao: hỗ trợ ParsedIntent v2 với product_names, sentiment, category_db
"""

import os
import sys
import mysql.connector
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ thư mục gốc của ai-service (tránh lỗi khi uvicorn chạy từ thư mục khác)
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

from services.intent_parser import ParsedIntent


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "he_thong_ban_hang_ai"),
        charset="utf8mb4",
        use_unicode=True,
    )


# Cột SELECT chuẩn: tên cột DB tiếng Việt → alias tiếng Anh (giữ nguyên contract trả về cho frontend)
_PRODUCT_COLUMNS = """
    p.ma_id                    AS id,
    p.ten                      AS name,
    p.duong_dan                AS slug,
    p.mo_ta_ngan               AS short_description,
    p.gia_goc                  AS base_price,
    p.gia_ban                  AS sale_price,
    p.phan_tram_giam           AS discount_percent,
    p.diem_danh_gia_trung_binh AS avg_rating,
    p.tong_danh_gia            AS total_reviews,
    p.tong_da_ban              AS total_sold,
    p.so_luong_ton             AS stock_quantity,
    p.duong_dan_anh_dai_dien   AS thumbnail_url,
    c.ten                      AS category_name
"""


def search_products(parsed: ParsedIntent, limit: int = 5) -> list[dict]:
    """
    Tìm sản phẩm phù hợp dựa trên ParsedIntent v2.
    Thứ tự ưu tiên lọc:
      1. Category (tên tiếng Việt hoặc slug)
      2. Brand
      3. Product name cụ thể (iPhone 15, Galaxy S24...)
      4. Purpose (gaming, lập trình...)
      5. Ngân sách
      6. Sentiment (rẻ → sắp xếp theo giá tăng, premium → giá giảm, best → rating)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        conditions = ["p.dang_hoat_dong = 1", "p.so_luong_ton > 0"]
        params: list = []

        # ── 1. Lọc theo Category ──────────────────────────────────
        if parsed.category:
            conditions.append("""
                p.ma_danh_muc IN (
                    SELECT ma_id FROM danh_muc
                    WHERE LOWER(ten) LIKE %s
                       OR LOWER(duong_dan) LIKE %s
                       OR LOWER(ten) LIKE %s
                )
            """)
            cat_name = f"%{parsed.category}%"
            cat_slug = f"%{parsed.category_db or parsed.category}%"
            params.extend([cat_name, cat_slug, cat_name])

        # ── 2. Lọc theo ngân sách ─────────────────────────────────
        if parsed.budget_min is not None:
            conditions.append("COALESCE(p.gia_ban, p.gia_goc) >= %s")
            params.append(parsed.budget_min)

        if parsed.budget_max is not None:
            conditions.append("COALESCE(p.gia_ban, p.gia_goc) <= %s")
            params.append(parsed.budget_max)

        # ── 3. Điều kiện OR (brand, product_names, purpose) ───────
        or_conditions = []

        # Brand
        for brand in parsed.brands:
            or_conditions.append("(LOWER(p.ten) LIKE %s OR LOWER(p.thuong_hieu) LIKE %s)")
            params.extend([f"%{brand}%", f"%{brand}%"])

        # Tên sản phẩm cụ thể
        for pname in parsed.product_names:
            or_conditions.append("LOWER(p.ten) LIKE %s")
            params.append(f"%{pname}%")

        # Purpose - tìm trong tên, mô tả ngắn
        if parsed.purpose:
            or_conditions.append("LOWER(p.ten) LIKE %s")
            params.append(f"%{parsed.purpose}%")
            or_conditions.append("LOWER(p.mo_ta_ngan) LIKE %s")
            params.append(f"%{parsed.purpose}%")

        # Từ khóa sạch (chỉ dùng khi không có category, brand, purpose)
        if not parsed.category and not parsed.brands and not parsed.purpose and not parsed.product_names:
            for kw in parsed.keywords[:3]:
                if len(kw) >= 3:
                    or_conditions.append("LOWER(p.ten) LIKE %s")
                    params.append(f"%{kw}%")

        if or_conditions:
            conditions.append(f"({' OR '.join(or_conditions)})")

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # ── 4. Sắp xếp theo sentiment ─────────────────────────────
        if parsed.sentiment == "cheap":
            order_clause = "ORDER BY COALESCE(p.gia_ban, p.gia_goc) ASC"
        elif parsed.sentiment == "premium":
            order_clause = "ORDER BY COALESCE(p.gia_ban, p.gia_goc) DESC"
        elif parsed.sentiment in ("best", "popular"):
            order_clause = "ORDER BY p.diem_danh_gia_trung_binh DESC, p.tong_da_ban DESC"
        else:
            order_clause = """
                ORDER BY
                    CASE WHEN p.gia_ban < p.gia_goc THEN 1 ELSE 0 END DESC,
                    p.diem_danh_gia_trung_binh DESC,
                    p.tong_da_ban DESC
            """

        sql = f"""
            SELECT {_PRODUCT_COLUMNS}
            FROM san_pham p
            LEFT JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE {where_clause}
            {order_clause}
            LIMIT %s
        """
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Chuyển Decimal → float để JSON serialize
        result = []
        for row in rows:
            product = dict(row)
            for key in ["base_price", "sale_price", "avg_rating", "discount_percent"]:
                if product.get(key) is not None:
                    product[key] = float(product[key])
            result.append(product)

        return result

    finally:
        cursor.close()
        conn.close()


def get_best_sellers(category_slug: Optional[str] = None, limit: int = 5) -> list[dict]:
    """Lấy sản phẩm bán chạy nhất, có thể lọc theo danh mục"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        conditions = ["p.dang_hoat_dong = 1", "p.so_luong_ton > 0"]
        params: list = []
        if category_slug:
            conditions.append("c.duong_dan LIKE %s")
            params.append(f"%{category_slug}%")
        where = " AND ".join(conditions)
        params.append(limit)
        cursor.execute(f"""
            SELECT {_PRODUCT_COLUMNS}
            FROM san_pham p
            LEFT JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE {where}
            ORDER BY p.tong_da_ban DESC, p.diem_danh_gia_trung_binh DESC
            LIMIT %s
        """, params)
        rows = cursor.fetchall()
        result = []
        for row in rows:
            product = dict(row)
            for key in ["base_price", "sale_price", "avg_rating", "discount_percent"]:
                if product.get(key) is not None:
                    product[key] = float(product[key])
            result.append(product)
        return result
    finally:
        cursor.close()
        conn.close()


def get_product_by_id(product_id: int) -> Optional[dict]:
    """Lấy thông tin chi tiết 1 sản phẩm"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(f"""
            SELECT {_PRODUCT_COLUMNS},
                   p.mo_ta       AS description,
                   p.thuong_hieu AS brand,
                   p.ma_sku      AS sku,
                   p.thong_so    AS specifications
            FROM san_pham p
            LEFT JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE p.ma_id = %s AND p.dang_hoat_dong = 1
        """, (product_id,))
        row = cursor.fetchone()
        if row:
            product = dict(row)
            for key in ["base_price", "sale_price", "avg_rating", "discount_percent"]:
                if product.get(key) is not None:
                    product[key] = float(product[key])
            return product
        return None
    finally:
        cursor.close()
        conn.close()


def format_products_for_ai(products: list[dict]) -> str:
    """
    Format sản phẩm thành văn bản để đưa vào prompt AI.
    Cung cấp đủ thông tin để AI tư vấn chính xác.
    """
    if not products:
        return "Không có sản phẩm nào phù hợp."

    lines = []
    for i, p in enumerate(products, 1):
        price = p.get("sale_price") or p.get("base_price") or 0
        price_str = f"{price:,.0f} VND"
        discount_note = ""
        if p.get("sale_price") and p.get("base_price") and p["sale_price"] < p["base_price"]:
            discount_pct = p.get("discount_percent") or round((1 - p["sale_price"] / p["base_price"]) * 100)
            price_str = f"{p['sale_price']:,.0f} VND (giảm {discount_pct}% từ {p['base_price']:,.0f})"
            discount_note = f"⭐ ĐANG GIẢM GIÁ {discount_pct}%"

        stock_note = f"Còn {p.get('stock_quantity', 0)} sản phẩm" if p.get("stock_quantity", 0) < 10 else "Còn hàng"

        lines.append(
            f"{i}. [ID:{p['id']}] **{p['name']}**\n"
            f"   📂 Danh mục: {p.get('category_name', 'N/A')}\n"
            f"   💰 Giá: {price_str} {discount_note}\n"
            f"   ⭐ Đánh giá: {p.get('avg_rating', 0):.1f}/5 ({p.get('total_reviews', 0)} đánh giá)\n"
            f"   📦 Đã bán: {p.get('total_sold', 0)} | {stock_note}\n"
            f"   📝 Mô tả: {(p.get('short_description') or 'Chưa có mô tả')[:200]}"
        )

    return "\n\n".join(lines)
