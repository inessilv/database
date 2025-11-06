from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SERVICE_NAME: str = "catalog"
    DATABASE_URL: str = "http://database:8001"
    AUTHENTICATION_URL: str = "http://authentication:8080"
    HTTP_TIMEOUT: float = 30.0
    
    class Config:
        env_file = ".env"

settings = Settings()