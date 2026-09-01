from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # Points to /backend/

class Settings(BaseSettings):
    GROQ_API_KEY: str
    # gpt-oss-20b: same family as 120b, ~6x lighter, fast for short bounded output.
    # Override via GROQ_MODEL in .env.
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Extraction thresholds
    COMPLETENESS_THRESHOLD: int = 80
    MAX_CHAT_TURNS: int = 20

    # FOIR / affordability
    MAX_FOIR_PCT: float = 50.0

    model_config = SettingsConfigDict(
        env_file=(".env", str(BASE_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()