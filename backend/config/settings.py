"""
Application configuration settings for SIH26032.
Centralizes all environment variables and secrets.
"""
import os
from pathlib import Path
from typing import Optional

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    # Minimal fallback in case environment is compiling
    from pydantic import BaseModel as BaseSettings, Field

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
DEFAULT_DB_PATH = (ROOT_DIR / "sih26032.db").as_posix()

class Settings(BaseSettings):
    APP_NAME: str = "SIH26032-Smart-Agricultural-Procurement"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "sih26032-gov-portal-secret-super-secure-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database (resolves absolute path)
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # Demonstration Mode
    DEMO_MODE: bool = True

    # Copernicus Sentinel-2
    COPERNICUS_CLIENT_ID: Optional[str] = None
    COPERNICUS_CLIENT_SECRET: Optional[str] = None

    # Weather
    OPENWEATHER_API_KEY: Optional[str] = None

    # Maps
    MAPPLS_API_KEY: Optional[str] = None

    # Bhashini Indian Languages
    BHASHINI_API_KEY: Optional[str] = None
    BHASHINI_USER_ID: Optional[str] = None

    # Notifications
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    SMS_API_KEY: Optional[str] = None
    IVR_API_KEY: Optional[str] = None

    # DBT / Payments
    PAYMENT_API_KEY: Optional[str] = None
    PAYMENT_SECRET: Optional[str] = None

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
