from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    CATALOG_URL: str = "http://catalog:8000"
    
    class Config:
        env_file = ".env"

settings = Settings()