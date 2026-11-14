import os
import asyncio
from openai import AsyncOpenAI

async def test():
    client = AsyncOpenAI(
        api_key="AQ.Ab8RN6KQ4mK-0IUvuatQf4CuyFSGR-QlK9qLK5QuOSuUbgN7bQ",
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    
    try:
        response = await client.chat.completions.create(
            model="gemini-flash-latest",
            messages=[{"role": "user", "content": "Hello, is this working?"}]
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
