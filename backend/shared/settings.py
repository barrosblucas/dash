"""Settings centralizados do backend."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações carregadas via variáveis de ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    access_token_secret: str = "dev-access-secret-change-me"
    refresh_token_secret: str = "dev-refresh-secret-change-me"
    password_reset_secret: str = "dev-password-reset-secret-change-me"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7
    password_reset_ttl_minutes: int = 30
    bootstrap_admin_name: str | None = None
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    password_reset_base_url: str = "http://localhost:3000/reset-password"
    saude_esaude_base_url: str = (
        "https://bandeirantes.esaude.genesiscloud.tec.br/publico/saude-transparente"
    )
    saude_esaude_timeout_seconds: float = 30.0
    saude_sync_interval_hours: int = 6

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if value is None or value == "":
            return ["http://localhost:3000"]
        if isinstance(value, list):
            origins = [str(item).strip() for item in value if str(item).strip()]
        elif isinstance(value, str):
            raw_value = value.strip()
            if raw_value.startswith("[") and raw_value.endswith("]"):
                stripped = raw_value[1:-1]
                origins = [
                    item.strip().strip('"').strip("'") for item in stripped.split(",")
                ]
            else:
                origins = [item.strip() for item in raw_value.split(",")]
            origins = [item for item in origins if item]
        else:
            raise ValueError(
                "cors_origins deve ser lista ou string separada por vírgula"
            )

        if any(origin == "*" for origin in origins):
            raise ValueError("cors_origins não pode conter '*' quando há credenciais")
        return origins


@lru_cache
def get_settings() -> Settings:
    """Retorna instância singleton de settings."""

    return Settings()
