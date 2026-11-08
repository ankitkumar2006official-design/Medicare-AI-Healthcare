import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "MediGuard AI – Operation Ward Zero"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mediguard-super-secret-jwt-key-operation-ward-zero-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mediguard_db")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "mediguard_db")
    
    # AI / LLM
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Simulator Defaults
    SIMULATOR_DEFAULT_INTERVAL_SECONDS: float = float(os.getenv("SIMULATOR_DEFAULT_INTERVAL_SECONDS", "3.0"))
    SIMULATOR_AUTO_START: bool = os.getenv("SIMULATOR_AUTO_START", "true").lower() in ("true", "1", "yes")

settings = Settings()

