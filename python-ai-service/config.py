"""
Configuration module for Python AI Service
Loads settings from .env with fallback defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ thư mục hiện tại của ai-service
_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)


class Config:
    # AI Mode & Local LLM
    AI_MODE: str = os.getenv("AI_MODE", "local")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "60.0"))

    # Database
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "1234")
    DB_NAME: str = os.getenv("DB_NAME", "he_thong_ban_hang_ai")

    # Service Server
    HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))

    # Security
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "")

    # Context window size
    CONTEXT_WINDOW_SIZE: int = int(os.getenv("CONTEXT_WINDOW_SIZE", "10"))


config = Config()

# Module-level variable aliases
AI_MODE = config.AI_MODE
OLLAMA_URL = config.OLLAMA_URL
OLLAMA_MODEL = config.OLLAMA_MODEL
OLLAMA_TIMEOUT = config.OLLAMA_TIMEOUT
DB_HOST = config.DB_HOST
DB_PORT = config.DB_PORT
DB_USER = config.DB_USER
DB_PASSWORD = config.DB_PASSWORD
DB_NAME = config.DB_NAME
AI_SERVICE_HOST = config.HOST
AI_SERVICE_PORT = config.PORT
INTERNAL_API_KEY = config.INTERNAL_API_KEY
CONTEXT_WINDOW_SIZE = config.CONTEXT_WINDOW_SIZE
