"""
MySQL Database Connector & Queries
Cung cấp kết nối và truy vấn dữ liệu sản phẩm, hành vi người dùng trực tiếp từ MySQL.
Không phụ thuộc internet, hoạt động 100% offline.
"""

import json
from typing import Any, Dict, List, Optional
import mysql.connector
from mysql.connector import Error as MySQLError
from config import config


def get_db_connection():
    """Tạo kết nối tới cơ sở dữ liệu MySQL cục bộ."""
    return mysql.connector.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
        connection_timeout=5,
    )


def check_db_health() -> Dict[str, Any]:
    """Kiểm tra trạng thái kết nối MySQL."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return {"status": "connected", "database": config.DB_NAME}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def query_products(
    category_name: Optional[str] = None,
    category_slug: Optional[str] = None,
    brands: Optional[List[str]] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    search_keywords: Optional[List[str]] = None,
    only_in_stock: bool = False,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Truy vấn danh sách sản phẩm thật từ bảng san_pham trong MySQL.
    """
    cat_filter = category_name or category_slug

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                p.ma_id AS id,
                p.ten AS name,
                p.duong_dan AS slug,
                p.ma_sku AS sku,
                p.thuong_hieu AS brand,
                p.mo_ta_ngan AS short_description,
                p.mo_ta AS description,
                p.thong_so AS specifications,
                p.the AS tags,
                p.gia_goc AS base_price,
                p.gia_ban AS sale_price,
                p.so_luong_ton AS stock_quantity,
                p.duong_dan_anh_dai_dien AS thumbnail_url,
                p.diem_danh_gia_trung_binh AS avg_rating,
                p.tong_danh_gia AS total_reviews,
                p.tong_da_ban AS total_sold,
                p.noi_bat AS is_featured,
                p.phan_tram_giam AS discount_percent,
                c.ten AS category_name
            FROM san_pham p
            LEFT JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE p.dang_hoat_dong = 1
        """
        params: List[Any] = []

        if only_in_stock:
            query += " AND p.so_luong_ton > 0"

        # Lọc danh mục với mapping từ khóa linh hoạt và chính xác theo từng loại thiết bị
        if cat_filter:
            category_mapping = {
                "phone": ["dien-thoai", "điện thoại", "phone", "smartphone", "iphone", "galaxy"],
                "laptop": ["laptop", "máy tính xách tay", "notebook", "macbook", "laptop-gaming", "laptop-van-phong", "laptop-may-tinh"],
                "tablet": ["tablet", "máy tính bảng", "may-tinh-bang", "ipad"],
                "headphone": ["tai nghe", "tai-nghe", "airpod", "wh1000", "chụp tai", "earbuds"],
                "speaker": ["loa", "loa-bluetooth", "loa bluetooth", "jbl", "marshall", "emberton", "flip"],
                "charger": ["sạc", "cáp", "sac-cap", "adapter", "anker", "type-c", "pd"],
                "case": ["ốp lưng", "bao da", "op-lung-bao-da"],
                "smartwatch": ["đồng hồ", "dong-ho-thong-minh", "smartwatch", "watch"],
                "accessory": ["phụ kiện", "phu-kien", "tai nghe", "tai-nghe", "loa", "loa-bluetooth", "sạc", "cáp", "sac-cap", "chuột", "bàn phím", "đồng hồ", "dong-ho", "ốp lưng"]
            }
            mapped_terms = category_mapping.get(cat_filter.lower(), [cat_filter])
            cat_clauses = []
            for term in mapped_terms:
                cat_clauses.append("(c.ten LIKE %s OR c.duong_dan LIKE %s OR p.ten LIKE %s)")
                params.append(f"%{term}%")
                params.append(f"%{term}%")
                params.append(f"%{term}%")
            if cat_clauses:
                query += f" AND ({' OR '.join(cat_clauses)})"

        # Lọc thương hiệu
        if brands and len(brands) > 0:
            brand_clauses = ["p.thuong_hieu LIKE %s" for _ in brands]
            query += f" AND ({' OR '.join(brand_clauses)})"
            for b in brands:
                params.append(f"%{b}%")

        # Lọc ngân sách (áp dụng trên giá bán hoặc giá gốc)
        if budget_min is not None:
            query += " AND COALESCE(p.gia_ban, p.gia_goc) >= %s"
            params.append(budget_min)

        if budget_max is not None:
            query += " AND COALESCE(p.gia_ban, p.gia_goc) <= %s"
            params.append(budget_max)

        # Lọc theo từ khóa tìm kiếm
        if search_keywords and len(search_keywords) > 0:
            kw_clauses = [
                "(p.ten LIKE %s OR p.mo_ta_ngan LIKE %s OR p.thuong_hieu LIKE %s)"
                for _ in search_keywords
            ]
            query += f" AND ({' OR '.join(kw_clauses)})"
            for kw in search_keywords:
                pattern = f"%{kw}%"
                params.extend([pattern, pattern, pattern])

        query += " ORDER BY p.noi_bat DESC, p.tong_da_ban DESC, p.diem_danh_gia_trung_binh DESC LIMIT %s"
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        # Parse JSON columns & format numbers
        results = []
        for r in rows:
            # Parse thong_so
            specs = r["specifications"]
            if isinstance(specs, str):
                try:
                    specs = json.loads(specs)
                except Exception:
                    specs = {}
            r["specifications"] = specs or {}

            # Parse the tags
            tags = r["tags"]
            if isinstance(tags, str):
                try:
                    tags = json.loads(tags)
                except Exception:
                    tags = []
            r["tags"] = tags or []

            # Format price numbers
            base_p = float(r["base_price"]) if r["base_price"] is not None else 0.0
            sale_p = float(r["sale_price"]) if r["sale_price"] is not None else base_p
            r["base_price"] = base_p
            r["sale_price"] = sale_p
            r["price"] = sale_p if sale_p > 0 else base_p
            r["avg_rating"] = float(r["avg_rating"]) if r["avg_rating"] is not None else 5.0
            r["total_reviews"] = int(r["total_reviews"] or 0)
            r["total_sold"] = int(r["total_sold"] or 0)
            r["stock_quantity"] = int(r["stock_quantity"] or 0)
            r["discount_percent"] = float(r["discount_percent"] or 0)

            results.append(r)

        return results

    except MySQLError as err:
        print(f"[MySQL Error in query_products]: {err}")
        return []
    except Exception as e:
        print(f"[Unexpected DB Error]: {e}")
        return []


def get_user_interactions(user_id: Optional[int]) -> Dict[str, Any]:
    """
    Lấy thông tin tương tác của người dùng để phục vụ Recommendation:
    - Lịch sử xem (view)
    - Lịch sử tìm kiếm (search)
    - Sản phẩm trong giỏ hàng (cart)
    - Lịch sử mua hàng (purchased)
    """
    if not user_id:
        return {
            "viewed_product_ids": [],
            "search_keywords": [],
            "cart_product_ids": [],
            "purchased_product_ids": [],
        }

    interactions = {
        "viewed_product_ids": [],
        "search_keywords": [],
        "cart_product_ids": [],
        "purchased_product_ids": [],
    }

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Lấy sản phẩm đã xem & từ khóa tìm kiếm gần đây từ hanh_vi_nguoi_dung
        cursor.execute(
            """
            SELECT ma_san_pham, loai_hanh_dong, tu_khoa_tim_kiem
            FROM hanh_vi_nguoi_dung
            WHERE ma_nguoi_dung = %s
            ORDER BY ngay_tao DESC
            LIMIT 30
            """,
            (user_id,),
        )
        behaviors = cursor.fetchall()
        for b in behaviors:
            if b.get("ma_san_pham"):
                if b["loai_hanh_dong"] == "view":
                    interactions["viewed_product_ids"].append(b["ma_san_pham"])
                elif b["loai_hanh_dong"] == "purchase":
                    interactions["purchased_product_ids"].append(b["ma_san_pham"])
            if b.get("tu_khoa_tim_kiem"):
                interactions["search_keywords"].append(b["tu_khoa_tim_kiem"].strip())

        # 2. Lấy sản phẩm hiện có trong giỏ hàng từ chi_tiet_gio_hang + gio_hang
        cursor.execute(
            """
            SELECT ctg.ma_san_pham
            FROM chi_tiet_gio_hang ctg
            JOIN gio_hang gh ON ctg.ma_gio_hang = gh.ma_id
            WHERE gh.ma_nguoi_dung = %s
            """,
            (user_id,),
        )
        cart_rows = cursor.fetchall()
        interactions["cart_product_ids"] = [r["ma_san_pham"] for r in cart_rows if r.get("ma_san_pham")]

        # 3. Lấy sản phẩm đã mua từ chi_tiet_don_hang + don_hang
        cursor.execute(
            """
            SELECT ctdh.ma_san_pham, ctdh.ten_san_pham AS product_name, sp.thuong_hieu AS brand_name, ctdh.don_gia
            FROM chi_tiet_don_hang ctdh
            JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_id
            LEFT JOIN san_pham sp ON ctdh.ma_san_pham = sp.ma_id
            WHERE dh.ma_nguoi_dung = %s AND dh.trang_thai != 'cancelled'
            ORDER BY dh.ngay_tao DESC
            LIMIT 10
            """,
            (user_id,),
        )
        order_rows = cursor.fetchall()
        purchased_details = []
        for r in order_rows:
            if r.get("ma_san_pham"):
                interactions["purchased_product_ids"].append(r["ma_san_pham"])
                if r.get("product_name"):
                    purchased_details.append(f"{r['product_name']} ({r.get('brand_name') or 'Chính hãng'})")
        interactions["purchased_details"] = list(set(purchased_details))[:5]

        # 4. Lấy chi tiết sản phẩm xem gần đây
        if interactions["viewed_product_ids"]:
            recent_ids = list(set(interactions["viewed_product_ids"][:5]))
            format_strings = ','.join(['%s'] * len(recent_ids))
            cursor.execute(
                f"SELECT ten, thuong_hieu FROM san_pham WHERE ma_id IN ({format_strings})",
                tuple(recent_ids)
            )
            v_rows = cursor.fetchall()
            interactions["viewed_details"] = [f"{vr['ten']} ({vr.get('thuong_hieu') or ''})" for vr in v_rows if vr.get("ten")]
        else:
            interactions["viewed_details"] = []

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[MySQL Warning in get_user_interactions]: {e}")

    return interactions
