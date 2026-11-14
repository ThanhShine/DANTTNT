"""
Memory Package
Personalized AI Memory System for Local LLM Chatbot
"""
from .extractor import extract_memories_from_message
from .manager import (
    get_user_memories,
    save_or_update_memory,
    delete_user_memory,
    delete_all_user_memories,
    update_user_memory,
    compile_and_update_preference_summary,
    get_user_preference_summary,
)
from .context_builder import build_personalized_context

__all__ = [
    "extract_memories_from_message",
    "get_user_memories",
    "save_or_update_memory",
    "delete_user_memory",
    "delete_all_user_memories",
    "update_user_memory",
    "compile_and_update_preference_summary",
    "get_user_preference_summary",
    "build_personalized_context",
]
