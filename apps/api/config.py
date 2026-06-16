from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    database_url: str = "postgresql+asyncpg://green:nudges@localhost:5432/greennudges"
    redis_url: str = "redis://localhost:6379/0"
    gemini_api_key: str = ""
    firebase_project_id: str = "goolge-cdc11"
    allowed_origins: str = "http://localhost:3000,https://goolge-cdc11.web.app,https://goolge-cdc11.firebaseapp.com"
    env: str = "development"


settings = Settings()
