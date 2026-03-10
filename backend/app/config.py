import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # App
    APP_NAME: str = "MedArchive AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medarchive-dev-secret")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medarchive.db")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    class Config:
        env_file = ".env"


settings = Settings()
