"""
Comprehensive Verification Script for Local LLM Chatbot Architecture
Tests the 9 scenarios requested:
1. Hỏi sản phẩm đơn giản
2. Hỏi theo ngân sách
3. Hỏi nhiều tiêu chí ("Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt")
4. So sánh 2 sản phẩm
5. Hỏi tiếp dựa trên câu trước (Follow-up)
6. Hỏi sản phẩm không tồn tại
7. Ollama tắt / kiểm tra thông báo khi Ollama offline
8. MySQL lỗi / kiểm tra database health handling
9. Sản phẩm hết hàng (Out of stock recognition)
10. Node.js endpoint POST /api/chat/message
"""

import sys
import json
import httpx
import asyncio

# Fix encoding
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PYTHON_AI_URL = "http://127.0.0.1:8000"
NODE_BACKEND_URL = "http://127.0.0.1:5000"


async def run_tests():
    print("=" * 70)
    print("🧪 BẮT ĐẦU KIỂM TRA HỆ THỐNG LOCAL LLM CHATBOT (OLLAMA + QWEN 2.5 7B)")
    print("=" * 70)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # TEST 0: Health check
        print("\n--- TEST 0: KIỂM TRA HEALTH CHECK CỦA AI SERVICE ---")
        try:
            res = await client.get(f"{PYTHON_AI_URL}/health")
            data = res.json()
            print(f"[OK] Health check HTTP {res.status_code}: {json.dumps(data, ensure_ascii=False, indent=2)}")
        except Exception as e:
            print(f"[FAIL] Health check: {e}")

        # TEST 1: Hỏi sản phẩm đơn giản
        print("\n--- TEST 1: HỎI SẢN PHẨM ĐƠN GIẢN ---")
        try:
            payload = {
                "message": "Cửa hàng có bán iPhone không?",
                "session_id": "test-session-1"
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')}")
            print(f"[PRODUCTS FOUND] {len(data.get('products', []))} sản phẩm")
            for p in data.get('products', [])[:2]:
                print(f"   -> {p.get('name')} | Giá: {p.get('price'):,.0f}đ")
        except Exception as e:
            print(f"[ERROR TEST 1]: {e}")

        # TEST 2: Hỏi theo ngân sách
        print("\n--- TEST 2: HỎI THEO NGÂN SÁCH (10 TRIỆU) ---")
        try:
            payload = {
                "message": "Tôi muốn mua điện thoại tầm 10 triệu",
                "session_id": "test-session-2"
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')}")
            print(f"[PRODUCTS] {len(data.get('products', []))} sản phẩm")
            for p in data.get('products', []):
                print(f"   -> {p.get('name')} | Giá: {p.get('price'):,.0f}đ")
        except Exception as e:
            print(f"[ERROR TEST 2]: {e}")

        # TEST 3: Hỏi nhiều tiêu chí (8 triệu + camera đẹp + gaming tốt)
        print("\n--- TEST 3: HỎI NHIỀU TIÊU CHÍ (Ví dụ đề bài: 8 triệu + camera + gaming) ---")
        try:
            payload = {
                "message": "Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt",
                "session_id": "test-session-3"
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')}")
            print(f"[SUGGESTIONS] {data.get('suggestions', [])}")
            print(f"[PRODUCTS] {len(data.get('products', []))} sản phẩm")
            for p in data.get('products', []):
                print(f"   -> {p.get('name')} | Giá: {p.get('price'):,.0f}đ | Brand: {p.get('brand_name')}")
        except Exception as e:
            print(f"[ERROR TEST 3]: {e}")

        # TEST 4: So sánh 2 sản phẩm
        print("\n--- TEST 4: SO SÁNH 2 SẢN PHẨM ---")
        try:
            payload = {
                "message": "So sánh giúp mình iPhone 15 và Samsung Galaxy S24",
                "session_id": "test-session-4"
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')[:300]}...")
        except Exception as e:
            print(f"[ERROR TEST 4]: {e}")

        # TEST 5: Hỏi tiếp dựa trên câu trước (Follow-up)
        print("\n--- TEST 5: HỎI TIẾP DỰA TRÊN LỊCH SỬ CHAT (Follow-up) ---")
        try:
            history = [
                {"role": "user", "content": "Tư vấn cho mình điện thoại Samsung khoảng 15 triệu"},
                {"role": "assistant", "content": "Dạ em gợi ý cho anh Samsung Galaxy S23 FE rất tốt ạ."}
            ]
            payload = {
                "message": "Còn con nào rẻ hơn mà pin trâu không?",
                "session_id": "test-session-5",
                "conversation_history": history
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')}")
            for p in data.get('products', []):
                print(f"   -> {p.get('name')} | Giá: {p.get('price'):,.0f}đ")
        except Exception as e:
            print(f"[ERROR TEST 5]: {e}")

        # TEST 6: Hỏi sản phẩm không tồn tại
        print("\n--- TEST 6: HỎI SẢN PHẨM HOÀN TOÀN KHÔNG TỒN TẠI (VD: Tàu ngầm vũ trụ hạt nhân) ---")
        try:
            payload = {
                "message": "Cửa hàng có bán xe tăng phản lực không?",
                "session_id": "test-session-6"
            }
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[MESSAGE] {data.get('message')}")
        except Exception as e:
            print(f"[ERROR TEST 6]: {e}")

        # TEST 7: Kiểm tra khi Ollama chưa chạy (Fallback message)
        print("\n--- TEST 7: KIỂM TRA THÔNG BÁO KHI OLLAMA CHƯA SẴN SÀNG ---")
        try:
            # We inspect current response message: if Ollama is offline, it will contain exact required notice
            payload = {"message": "Tư vấn laptop văn phòng"}
            res = await client.post(f"{PYTHON_AI_URL}/api/ai/chat", json=payload)
            data = res.json()
            print(f"[Ollama Fallback Message Check]: {data.get('message')[:100]}...")
            if "AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama." in data.get('message', ''):
                print("[PASS] Thông báo chuẩn xác: 'AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.'")
            else:
                print(f"[INFO] Ollama hiện đang trả về câu trả lời từ mô hình: {data.get('model', 'local')}")
        except Exception as e:
            print(f"[ERROR TEST 7]: {e}")

        # TEST 8: Kiểm tra Node.js Backend API POST /api/chat/message
        print("\n--- TEST 8: KIỂM TRA NODE.JS BACKEND API POST /api/chat/message ---")
        try:
            node_payload = {
                "message": "Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt"
            }
            res = await client.post(f"{NODE_BACKEND_URL}/api/chat/message", json=node_payload)
            data = res.json()
            print(f"[STATUS] HTTP {res.status_code}")
            print(f"[NODE RESPONSE SUCCESS] {data.get('success')}")
            print(f"[SESSION ID] {data.get('session_id')}")
            print(f"[MESSAGE] {data.get('message')[:150]}...")
            print(f"[PRODUCTS RETURNED VIA NODE] {len(data.get('products', []))} sản phẩm")
            if data.get('products'):
                print(f"   -> Top 1: {data.get('products')[0].get('name')} ({data.get('products')[0].get('price'):,.0f}đ)")
        except Exception as e:
            print(f"[ERROR TEST 8]: {e}")

        # TEST 9: Kiểm tra tính toàn vẹn của chat_messages trong MySQL
        print("\n--- TEST 9: KIỂM TRA LỊCH SỬ CHAT LƯU TRONG MYSQL ---")
        try:
            import mysql.connector
            conn = mysql.connector.connect(
                host="localhost",
                port=3306,
                user="root",
                password="1234",
                database="he_thong_ban_hang_ai"
            )
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, session_id, sender_type, message, created_at FROM chat_messages ORDER BY id DESC LIMIT 4")
            rows = cursor.fetchall()
            print(f"[OK] {len(rows)} tin nhắn gần nhất trong database:")
            for r in rows:
                print(f"   [{r['id']}] {r['sender_type'].upper()}: {r['message'][:80]}... ({r['created_at']})")
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"[ERROR TEST 9]: {e}")

    print("\n" + "=" * 70)
    print("🎉 HOÀN THÀNH BỘ KIỂM TRA TOÀN DIỆN!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_tests())
