"""
KOAJ Access v2.0 — Permoda S.A.S.
Schemas de autenticación

Cubre:
  - Request/Response de login
  - Refresh token
  - Cambio de contraseña
  - Perfil del usuario autenticado (/auth/me)
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Requests ──────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class CambiarPasswordRequest(BaseModel):
    password_actual: str = Field(min_length=1)
    password_nueva:  str = Field(min_length=8)


# ── Responses ─────────────────────────────────────────────────────

class RolResponse(BaseModel):
    id:     int
    nombre: str

    model_config = {"from_attributes": True}


class SedeAsignadaResponse(BaseModel):
    id:     int
    nombre: str
    codigo: str

    model_config = {"from_attributes": True}


class UsuarioMeResponse(BaseModel):
    """
    Perfil del usuario autenticado.
    Retornado en POST /auth/login y GET /auth/me.
    """
    id:                    int
    email:                 str
    nombre_completo:       str
    activo:                bool
    debe_cambiar_password: bool
    ultimo_login:          datetime | None
    roles:                 list[RolResponse]
    sede_asignada_id:      int | None = None
    sede_asignada:         SedeAsignadaResponse | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """
    Par de tokens emitido en login y refresh.
    """
    access_token:          str
    refresh_token:         str
    token_type:            str = "bearer"
    debe_cambiar_password: bool


class LoginResponse(BaseModel):
    """
    Respuesta completa del login.
    Incluye tokens + perfil para que el frontend
    no necesite hacer una segunda llamada a /auth/me.
    """
    tokens:  TokenResponse
    usuario: UsuarioMeResponse