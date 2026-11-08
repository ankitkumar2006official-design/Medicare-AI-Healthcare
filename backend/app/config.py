import os
from pydantic import BaseModel

def _load_env_files():
    possible_paths = [
        os.path.abspath(".env"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_files()

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
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://frontend-fawn-eight-96.vercel.app"
        ).split(",")
        if origin.strip()
    ]
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mediguard-super-secret-jwt-key-operation-ward-zero-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # MongoDB Atlas
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "mediguard_db")
    
    # AI / LLM (Groq API)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Simulator Defaults
    SIMULATOR_DEFAULT_INTERVAL_SECONDS: float = float(os.getenv("SIMULATOR_DEFAULT_INTERVAL_SECONDS", "3.0"))
    SIMULATOR_AUTO_START: bool = os.getenv("SIMULATOR_AUTO_START", "true").lower() in ("true", "1", "yes")

settings = Settings()
