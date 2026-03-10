"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Configuración central de la aplicación.

Usa pydantic-settings para cargar variables desde .env.
Todos los módulos importan `settings` desde aquí.
En desarrollo funciona sin .env (valores por defecto seguros).
En producción valida que los valores críticos estén configurados.
"""

from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración global de KOAJ Access.

    Los campos sin default son OBLIGATORIOS en producción.
    Los campos con default funcionan en desarrollo sin .env.
    """

    # ── Aplicación ────────────────────────────────────────────────
    APP_NAME: str = "KOAJ Access API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ── Base de datos ─────────────────────────────────────────────
    DATABASE_URL: str = (
        "mysql+pymysql://root:root@localhost:3306/koaj_access"
    )

    # ── JWT ───────────────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-NO-usar-en-produccion-32chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # ── Archivos ──────────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    # ── API Keys para hardware externo ────────────────────────────
    LPR_API_KEY: str = ""       # Cámara LPR de entrada al parqueadero
    NFC_READER_API_KEY: str = "" # Lector fijo NFC de activos

    # ── pydantic-settings: leer desde .env si existe ──────────────
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",   # Ignorar variables del .env que no estén aquí
    )

    # ── Propiedades computadas ────────────────────────────────────
    @property
    def allowed_origins_list(self) -> list[str]:
        """Convierte ALLOWED_ORIGINS (string CSV) a lista de strings."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # ── Validaciones de producción ────────────────────────────────
    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """
        En producción falla el arranque si los valores críticos
        siguen siendo los de desarrollo. Previene deploys inseguros.
        """
        if self.ENVIRONMENT == "production":
            if "dev-secret-key" in self.SECRET_KEY:
                raise ValueError(
                    "SECRET_KEY debe ser cambiado antes de ir a producción. "
                    "Genera uno con: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            if "root:root@localhost" in self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL no puede usar credenciales de desarrollo en producción."
                )
            if not self.LPR_API_KEY:
                raise ValueError("LPR_API_KEY es requerido en producción.")
            if not self.NFC_READER_API_KEY:
                raise ValueError("NFC_READER_API_KEY es requerido en producción.")
        return self


@lru_cache
def get_settings() -> Settings:
    """
    Retorna la instancia singleton de Settings.
    @lru_cache garantiza que solo se instancia una vez por proceso.
    Usar como dependencia de FastAPI: Depends(get_settings)
    O importar directamente: from app.config import settings
    """
    return Settings()


# Instancia global — importar esto en todos los módulos
settings: Settings = get_settings()