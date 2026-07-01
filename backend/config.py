from typing import List, Tuple
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    apify_token: str = ""
    llm_provider: str = "gemini"
    
    # Models configuration
    gemini_models: List[str] = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    openai_models: List[str] = ["gpt-4o", "gpt-4o-mini"]
    
    # Supported cities configuration mapping
    supported_cities: List[Tuple[str, List[str]]] = [
        ("Pune", ["pune"]),
        ("Mumbai", ["mumbai"]),
        ("Bangalore", ["bangalore", "bengaluru"]),
        ("Delhi", ["delhi"]),
        ("Ahmedabad", ["ahmedabad"]),
        ("Surat", ["surat"]),
        ("Hyderabad", ["hyderabad"]),
        ("Chennai", ["chennai"])
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

# Instantiate settings
settings = Settings()
