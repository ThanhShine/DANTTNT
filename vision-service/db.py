"""
db.py — Kết nối MySQL cho Vision Service
Tái sử dụng cấu hình từ file .env
"""

import os
import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool
from dotenv import load_dotenv

load_dotenv()

# Connection pool — dùng chung, thread-safe
_pool: MySQLConnectionPool | None = None


def get_pool() -> MySQLConnectionPool:
    global _pool
    if _pool is None:
        _pool = MySQLConnectionPool(
            pool_name="vision_pool",
            pool_size=3,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "he_thong_ban_hang_ai"),
            charset="utf8mb4",
            use_unicode=True,
        )
    return _pool


def get_connection():
    return get_pool().get_connection()


def find_products_by_category(category_name: str, limit: int = 8) -> list[dict]:
    """
    Tìm sản phẩm theo category name (kết quả nhận diện từ YOLOv8).
    Mapping từ class YOLO -> tên danh mục tiếng Việt trong DB.
    """
    # Ánh xạ YOLO class -> keyword tìm trong DB
    CATEGORY_MAP: dict[str, list[str]] = {
        "laptop":      ["laptop", "máy tính xách tay"],
        "cell phone":  ["điện thoại", "smartphone", "iphone", "samsung"],
        "remote":      ["remote", "điều khiển"],
        "keyboard":    ["bàn phím", "keyboard"],
        "mouse":       ["chuột", "mouse"],
        "tv":          ["tivi", "màn hình", "tv", "television"],
        "headphones":  ["tai nghe", "headphone", "earphone"],
        "backpack":    ["ba lô", "túi", "balo"],
        "umbrella":    ["ô", "dù", "umbrella"],
        "handbag":     ["túi xách", "handbag"],
        "book":        ["sách", "book"],
        "clock":       ["đồng hồ", "clock", "watch"],
        "vase":        ["bình hoa", "vase"],
        "scissors":    ["kéo", "scissors"],
        "toothbrush":  ["bàn chải", "toothbrush"],
    }

    keywords = CATEGORY_MAP.get(category_name.lower(), [category_name.lower()])
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Tạo điều kiện LIKE cho tất cả keywords
        like_conditions = " OR ".join(
            ["LOWER(c.ten) LIKE %s" for _ in keywords] +
            ["LOWER(p.ten) LIKE %s" for _ in keywords]
        )
        params = [f"%{k}%" for k in keywords] * 2 + [limit]

        sql = f"""
            SELECT
                p.ma_id                      AS product_id,
                p.ten                        AS product_name,
                p.gia_goc                    AS price,
                p.gia_ban                    AS sale_price,
                p.duong_dan_anh_dai_dien     AS image,
                p.so_luong_ton               AS stock_quantity,
                p.diem_danh_gia_trung_binh   AS avg_rating,
                c.ten                        AS category_name
            FROM san_pham p
            JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE p.dang_hoat_dong = 1
              AND p.so_luong_ton > 0
              AND ({like_conditions})
            ORDER BY p.tong_da_ban DESC, p.diem_danh_gia_trung_binh DESC
            LIMIT %s
        """

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        cursor.close()
        return rows
    except Exception as e:
        print(f"[DB Error] find_products_by_category: {e}")
        return []
    finally:
        if conn:
            conn.close()


def find_popular_products(limit: int = 8) -> list[dict]:
    """Fallback: Lấy sản phẩm phổ biến nhất khi YOLO không nhận diện được."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                p.ma_id                      AS product_id,
                p.ten                        AS product_name,
                p.gia_goc                    AS price,
                p.gia_ban                    AS sale_price,
                p.duong_dan_anh_dai_dien     AS image,
                p.diem_danh_gia_trung_binh   AS avg_rating,
                c.ten                        AS category_name
            FROM san_pham p
            JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
            WHERE p.dang_hoat_dong = 1 AND p.so_luong_ton > 0
            ORDER BY p.tong_da_ban DESC, p.diem_danh_gia_trung_binh DESC
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()
        cursor.close()
        return rows
    except Exception as e:
        print(f"[DB Error] find_popular_products: {e}")
        return []
    finally:
        if conn:
            conn.close()

