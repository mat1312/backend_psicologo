# Configurazioni centralizzate dell'applicazione
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, Dict, Any, List


class Settings(BaseSettings):
    """Configurazioni centralizzate dell'applicazione"""
    
    # Server
    API_V1_PREFIX: str
    PROJECT_NAME: str
    DEBUG: bool
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Database
    DATABASE_URL: str
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # ElevenLabs (opzionale)
    ELEVENLABS_API_KEY: Optional[str] = None
    
    # Qdrant (opzionale)
    QDRANT_URL: Optional[str] = None
    QDRANT_COLLECTION_NAME: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Singleton per le impostazioni"""
    return Settings()