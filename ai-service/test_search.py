import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

# Test trực tiếp product_searcher với intent đã parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from services.intent_parser import parse_intent
from services.product_searcher import search_products, get_db_connection

# Test 1: Parse intent
msg = "tai nghe"
parsed = parse_intent(msg)
print(f"=== parse_intent('{msg}') ===")
print(f"  intent: {parsed.intent}")
print(f"  category: {parsed.category}")
print(f"  category_db: {parsed.category_db}")
print(f"  brands: {parsed.brands}")
print(f"  keywords: {parsed.keywords}")

# Test 2: DB query trực tiếp
print("\n=== Direct DB query ===")
try:
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    
    # Check what the searcher would do
    cat = parsed.category  # "tai nghe"
    cat_db = parsed.category_db  # "headphone"
    
    print(f"Searching category: '{cat}', slug: '{cat_db}'")
    
    cur.execute("""
        SELECT ma_id AS id, ten AS name, duong_dan AS slug FROM danh_muc
        WHERE LOWER(ten) LIKE %s
           OR LOWER(duong_dan) LIKE %s
           OR LOWER(ten) LIKE %s
    """, (f"%{cat}%", f"%{cat_db}%", f"%{cat}%"))
    cats = cur.fetchall()
    print(f"Categories matched: {cats}")
    
    # Test full product search
    products = search_products(parsed, limit=5)
    print(f"\nProducts found: {len(products)}")
    for p in products:
        print(f"  [{p['id']}] {p['name']} | {p.get('category_name')}")
    
    conn.close()
except Exception as e:
    print(f"DB ERROR: {e}")

# Test 3: điện thoại
msg2 = "dien thoai"
parsed2 = parse_intent(msg2)
print(f"\n=== parse_intent('{msg2}') ===")
print(f"  intent: {parsed2.intent}")
print(f"  category: {parsed2.category}")
print(f"  category_db: {parsed2.category_db}")
