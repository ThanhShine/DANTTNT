import requests
import json
from dotenv import load_dotenv
import os

# Test chat endpoint
def test_chat(message):
    res = requests.post(
        "http://localhost:8000/chat",
        json={"message": message, "conversation_history": []},
        timeout=60
    )
    print(f"\n=== '{message}' ===")
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Intent: {data.get('intent')}")
        print(f"Is Error: {data.get('is_error')}")
        print(f"Products: {len(data.get('products', []))}")
        print(f"Message preview: {data.get('message', '')[:200]}")
    else:
        print(f"Error: {res.text[:300]}")

test_chat("tai nghe")
test_chat("điện thoại")
