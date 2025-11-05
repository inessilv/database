"""
Database Service Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Service info
    SERVICE_NAME: str = "database"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DATABASE_PORT: int = 8001
    
    # Database settings
    DB_PATH: str = "/data/ltplabs.db"
    SQLITE_TIMEOUT: int = 30000
    LOAD_SEED_DATA: str = "true"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Security
    ENCRYPTION_KEY: Optional[str] = None
    JWT_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
