"""
Chatbot Package
Local LLM with Ollama & Qwen 2.5 7B
"""
from .llm_service import llm_service, LLMService
from .intent import parse_user_intent, extract_budget, extract_category, extract_brand, extract_features
from .product_context import build_product_context_text, sanitize_product_for_frontend, format_currency_vnd
from .prompt import build_system_prompt, prepare_llm_messages, build_augmented_user_message
from .response import build_final_response, format_offline_fallback, generate_suggestion_chips

# Backward compatibility aliases
check_ollama_status = llm_service.check_health
generate_llm_response = llm_service.generate_chat_response
parse_intent = parse_user_intent
build_product_context = build_product_context_text

__all__ = [
    "llm_service",
    "LLMService",
    "check_ollama_status",
    "generate_llm_response",
    "parse_user_intent",
    "parse_intent",
    "extract_budget",
    "extract_category",
    "extract_brand",
    "extract_features",
    "build_product_context_text",
    "build_product_context",
    "sanitize_product_for_frontend",
    "format_currency_vnd",
    "build_system_prompt",
    "prepare_llm_messages",
    "build_augmented_user_message",
    "build_final_response",
    "format_offline_fallback",
    "generate_suggestion_chips"
]
