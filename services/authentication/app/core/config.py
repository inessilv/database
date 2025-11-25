"""
Settings e Configuração
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application Settings"""
    
    # Database Service URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "http://database.ecatalog.svc.cluster.local:8001"
    )
    
    # HTTP Timeout
    HTTP_TIMEOUT: float = 30.0
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    
    # Microsoft OAuth
    MICROSOFT_CLIENT_ID: str = os.getenv("MICROSOFT_CLIENT_ID", "")
    MICROSOFT_CLIENT_SECRET: str = os.getenv("MICROSOFT_CLIENT_SECRET", "")
    MICROSOFT_REDIRECT_URI: str = os.getenv("MICROSOFT_REDIRECT_URI", "")
    MICROSOFT_TENANT_ID: str = os.getenv("MICROSOFT_TENANT_ID", "common")
    
    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Allowed email domains for authentication (minimum role: viewer/client)
    ALLOWED_DOMAINS: list = ["alunos.uminho.pt", "ltplabs.com"]
    
    class Config:
        env_file = ".env"


settings = Settings()
