import mysql.connector
from dotenv import load_dotenv
import os
import sys

load_dotenv()
sys.stdout.reconfigure(encoding='utf-8')

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "he_thong_ban_hang_ai"),
        charset="utf8mb4",
        use_unicode=True,
    )
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM san_pham WHERE dang_hoat_dong=1")
    print("Total active products:", cur.fetchone()[0])

    cur.execute("SELECT ma_id, ten FROM danh_muc")
    cats = cur.fetchall()
    print("=== Categories ===")
    for r in cats:
        print(f"  [{r[0]}] {r[1]}")

    print("=== Sample Products ===")
    cur.execute("SELECT ma_id, ten, ma_danh_muc FROM san_pham WHERE dang_hoat_dong=1 LIMIT 15")
    prods = cur.fetchall()
    for r in prods:
        print(f"  [{r[0]}] cat_id={r[2]} | {r[1]}")

    # Test the tai nghe search
    print("=== Search: tai nghe ===")
    cur.execute("""
        SELECT p.ma_id, p.ten, c.ten
        FROM san_pham p
        JOIN danh_muc c ON p.ma_danh_muc = c.ma_id
        WHERE LOWER(c.ten) LIKE '%tai nghe%'
           OR LOWER(c.ten) LIKE '%headphone%'
           OR LOWER(c.duong_dan) LIKE '%headphone%'
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"  [{r[0]}] cat={r[2]} | {r[1]}")

    conn.close()
    print("OK")
except Exception as e:
    print("ERROR:", e)
