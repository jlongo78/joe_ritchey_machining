"""
Application Configuration Settings
Loads settings from environment variables with sensible defaults.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Precision Engine and Dyno, LLC"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/precision_engine.db"
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    JWT_SECRET: str = "your-jwt-secret-key-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Email - SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    MAIL_FROM_EMAIL: str = "noreply@precisionenginedyno.com"
    MAIL_FROM_NAME: str = "Precision Engine and Dyno"

    # SMS - Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Payment - Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PUBLIC_KEY: Optional[str] = None

    # Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    ALLOWED_DOCUMENT_TYPES: List[str] = ["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

    # MinIO / S3
    MINIO_ENDPOINT: Optional[str] = None
    MINIO_ACCESS_KEY: Optional[str] = None
    MINIO_SECRET_KEY: Optional[str] = None
    MINIO_BUCKET: str = "precision-engine"
    MINIO_SECURE: bool = False

    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:3000"
    PORTAL_URL: str = "http://localhost:3002"

    # Pricing Engine
    PRICE_SYNC_INTERVAL_MINUTES: int = 60
    DEFAULT_MARGIN_PERCENT: float = 25.0
    MIN_MARGIN_PERCENT: float = 10.0
    MAX_MARGIN_PERCENT: float = 50.0

    # Business Settings
    TAX_RATE_DEFAULT: float = 0.0825  # 8.25%
    LABOR_RATE_DEFAULT: float = 125.00  # Per hour

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
