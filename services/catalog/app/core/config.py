from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SERVICE_NAME: str = "catalog"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # URL do Authentication Service
    AUTHENTICATION_URL: str = "http://authentication:8080"
    
    class Config:
        env_file = ".env"

settings = Settings()