from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    database_url: str = "postgresql+asyncpg://green:nudges@localhost:5432/greennudges"
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str = ""
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""
    climatiq_api_key: str = ""


settings = Settings()
