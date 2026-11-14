"""
OpenAI Service — Gọi GPT để tạo câu trả lời tự nhiên
Quản lý context window, system prompt tiếng Việt, và fallback
"""

import os
import asyncio
from pathlib import Path
from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
from dotenv import load_dotenv

# Load .env từ thư mục gốc của ai-service
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# Khởi tạo client (lazy)
_client: AsyncOpenAI | None = None

def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY", "")
        base_url = os.getenv("OPENAI_BASE_URL", "")
        if not api_key or api_key.startswith("sk-your"):
            raise ValueError("OPENAI_API_KEY chưa được cấu hình trong file .env")
        _client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url if base_url else None,
            timeout=float(os.getenv("OPENAI_TIMEOUT", "60")),
        )
    return _client


SYSTEM_PROMPT = """Bạn là "Trợ lý Bán hàng AI" của cửa hàng điện tử thông minh SalesAI.
Tính cách: thân thiện như người bạn, hiểu tâm lý mua sắm người Việt, chuyên nghiệp nhưng không cứng nhắc.

═══════════════════════════════════════════
QUY TẮC TỐI THƯỢNG — TUYỆT ĐỐI TUÂN THỦ:
═══════════════════════════════════════════
1. CHỈ TƯ VẤN SẢN PHẨM CÓ TRONG DANH SÁCH "Sản phẩm phù hợp trong kho" — KHÔNG được nhắc đến bất kỳ sản phẩm, mẫu mã, hay thương hiệu nào không có trong danh sách.
2. Nếu danh sách là "Không có sản phẩm nào phù hợp." → thành thật nói cửa hàng chưa có mặt hàng này, hỏi xem khách có muốn tìm loại khác không.
3. Không bịa đặt giá, cấu hình, thông số kỹ thuật — chỉ dùng thông tin từ danh sách được cung cấp.

═══════════════════════════════════════
CÁCH XỬ LÝ THEO TÌNH HUỐNG:
═══════════════════════════════════════
🟢 **Chào hỏi xã giao** (xin chào, hello...):
   → Chào lại thân thiện, giới thiệu bản thân, hỏi khách cần tìm gì.

🔍 **Tìm sản phẩm / danh mục** (điện thoại, laptop, tai nghe...):
   → Liệt kê các sản phẩm từ danh sách, nêu điểm nổi bật ngắn gọn.
   → Hỏi thêm để thu hẹp: ngân sách, mục đích sử dụng, thương hiệu ưa thích.

💰 **Tìm theo ngân sách** (dưới 15 triệu, tầm 20tr...):
   → Gợi ý 2-3 sản phẩm trong tầm giá, so sánh nhanh điểm mạnh của từng cái.
   → Luôn nêu giá chính xác để khách ra quyết định ngay.

🆚 **So sánh sản phẩm**:
   → Lập bảng so sánh ngắn gọn: Giá | Rating | Điểm mạnh | Điểm yếu.
   → Kết luận bằng khuyến nghị cụ thể dựa trên nhu cầu đã biết.

🎯 **Mục đích cụ thể** (gaming, lập trình, học tập...):
   → Giải thích TẠI SAO sản phẩm đó phù hợp với mục đích đó.
   → Đề cập tính năng/thông số liên quan trực tiếp đến mục đích sử dụng.

⭐ **Hỏi sản phẩm tốt nhất / bán chạy**:
   → Dựa vào rating và total_sold trong danh sách để xác định.

═══════════════════════════════════════
PHONG CÁCH VIẾT:
═══════════════════════════════════════
- Luôn dùng TIẾNG VIỆT, ngắn gọn dễ đọc
- Dùng emoji hợp lý để sinh động (📱💻🎧💰⭐)
- Format bằng **bold**, bullet points, xuống dòng rõ ràng
- Câu trả lời vừa đủ, không dài dòng — khách bận lắm!
- Cuối mỗi tin nhắn nên có 1 câu hỏi dẫn dắt để duy trì cuộc trò chuyện"""


FALLBACK_MESSAGE = """Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧

Tuy nhiên, tôi có thể giúp bạn:
- 🔍 Tìm kiếm sản phẩm theo danh mục
- 💰 Lọc theo ngân sách
- ⭐ Xem sản phẩm bán chạy nhất

Vui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp."""

async def generate_response(
    user_message: str,
    products_context: str,
    conversation_history: list[dict],
    intent: str = "general",
) -> tuple[str, int]:
    """
    Gọi OpenAI API để tạo câu trả lời.
    
    Returns:
        (response_text, tokens_used)
    """
    client = get_openai_client()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
    temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))

    # Xây dựng messages với context window
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Thêm lịch sử hội thoại (giới hạn context window)
    context_window = int(os.getenv("CONTEXT_WINDOW_SIZE", "10"))
    if conversation_history:
        messages.extend(conversation_history[-context_window:])

    # User message với context sản phẩm luôn được thêm vào
    user_content = f"""{user_message}

---
**Sản phẩm phù hợp trong kho:**
{products_context}
---
Dựa vào danh sách trên, hãy tư vấn cụ thể. Nếu danh sách ghi là 'Không có sản phẩm nào phù hợp.', hãy lịch sự báo cho khách biết cửa hàng hiện chưa có sản phẩm nào khớp với yêu cầu và hỏi họ có muốn tìm loại khác không."""

    messages.append({"role": "user", "content": user_content})

    max_retries = 2
    base_delay = 1
    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            break
        except Exception as e:
            err_str = str(e).lower()
            # Do not retry on hard quota/billing exhaustion
            if "quota" in err_str or "billing" in err_str or attempt == max_retries - 1:
                raise e
            if "503" in err_str or "429" in err_str or "ratelimit" in err_str:
                await asyncio.sleep(base_delay * (attempt + 1))
            else:
                raise e

    content = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else 0

    return content, tokens


async def generate_suggestions(
    conversation_context: str,
    intent: str,
) -> list[str]:
    """
    Tạo 3 câu gợi ý tương tác tiếp theo dựa trên context
    """
    SUGGESTION_TEMPLATES = {
        "budget_search": [
            "Bạn cần laptop để làm gì? (gaming, lập trình, văn phòng?)",
            "Bạn ưu tiên thương hiệu nào không?",
            "Bạn muốn pin trâu hay màn hình lớn?",
        ],
        "product_inquiry": [
            "Bạn muốn so sánh với sản phẩm khác không?",
            "Bạn cần thêm thông tin về tính năng cụ thể nào?",
            "Ngân sách của bạn là bao nhiêu?",
        ],
        "comparison": [
            "Bạn muốn tôi tư vấn thêm loại nào khác không?",
            "Mục đích sử dụng chính của bạn là gì?",
            "Bạn quan tâm nhiều đến hiệu năng hay thiết kế?",
        ],
        "recommendation": [
            "Bạn có muốn thấy thêm sản phẩm trong tầm giá khác không?",
            "Bạn muốn tôi giải thích chi tiết về sản phẩm nào?",
            "Bạn cần thêm phụ kiện đi kèm không?",
        ],
        "general": [
            "Bạn đang tìm kiếm sản phẩm gì hôm nay?",
            "Ngân sách của bạn là bao nhiêu?",
            "Tôi có thể giúp gì thêm cho bạn?",
        ],
    }

    return SUGGESTION_TEMPLATES.get(intent, SUGGESTION_TEMPLATES["general"])


async def call_ai_with_fallback(
    user_message: str,
    products_context: str,
    conversation_history: list[dict],
    intent: str = "general",
) -> tuple[str, int, bool]:
    """
    Gọi OpenAI với fallback an toàn.
    Khi API gặp sự cố/hết quota, tự động dùng danh sách sản phẩm thật từ DB để tư vấn ngay.
    
    Returns:
        (message, tokens_used, is_error)
    """
    def _smart_fallback() -> str:
        if products_context and "Không có sản phẩm" not in products_context and "Không thể tải" not in products_context:
            return (
                f"Dạ chào bạn! Dưới đây là các sản phẩm phù hợp nhất trong kho của SalesAI:\n\n"
                f"{products_context}\n\n"
                f"Bạn có muốn xem chi tiết thông số hoặc so sánh sản phẩm nào ở trên không ạ? 😊"
            )
        return FALLBACK_MESSAGE

    try:
        message, tokens = await generate_response(
            user_message, products_context, conversation_history, intent
        )
        return message, tokens, False

    except ValueError:
        return _smart_fallback(), 0, False

    except (APITimeoutError, RateLimitError, APIError):
        return _smart_fallback(), 0, False

    except Exception:
        return _smart_fallback(), 0, False

