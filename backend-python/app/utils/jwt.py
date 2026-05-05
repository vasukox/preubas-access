"""
KOAJ Access v2.0 — Permoda S.A.S.
Utilidades para manejo de tokens JWT.

Responsabilidades:
  - Crear access tokens (30 minutos)
  - Crear refresh tokens (7 días) con JTI para rotación
  - Verificar y decodificar tokens
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import ExpiredSignatureError, JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

ACCESS_TOKEN_TYPE  = "access"
REFRESH_TOKEN_TYPE = "refresh"


# ── Crear tokens ──────────────────────────────────────────────────
def create_access_token(
    usuario_id:            int,
    email:                 str,
    roles:                 list[str],
    debe_cambiar_password: bool = False,
) -> str:
    """
    Crea un access token JWT de corta duración.

    Claims incluidos:
      sub   → usuario_id (int)
      email → email del usuario
      roles → lista de nombres de roles
      dcp   → debe_cambiar_password
      type  → "access"
    """
    now    = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub":   str(usuario_id),
        "email": email,
        "roles": roles,
        "dcp":   debe_cambiar_password,
        "type":  ACCESS_TOKEN_TYPE,
        "iat":   now,
        "exp":   expire,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug(f"Access token creado para usuario_id={usuario_id}")
    return token


def create_refresh_token(
    usuario_id: int,
    jti:        str,
) -> str:
    """
    Crea un refresh token JWT de larga duración.

    El JTI (JWT ID) se persiste en BD para permitir
    rotación y revocación.

    Claims incluidos:
      sub  → usuario_id
      jti  → UUID único del token
      type → "refresh"
    """
    now    = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub":  str(usuario_id),
        "jti":  jti,
        "type": REFRESH_TOKEN_TYPE,
        "iat":  now,
        "exp":  expire,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug(f"Refresh token creado para usuario_id={usuario_id}, jti={jti}")
    return token


# ── Decodificación interna (DRY) ──────────────────────────────────
def _decode_token(token: str, expected_type: str) -> dict[str, Any] | None:
    """
    Verifica y decodifica un token JWT.
    Centraliza la lógica de verify_access_token y verify_refresh_token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("type") != expected_type:
            logger.warning(
                f"Tipo de token incorrecto. "
                f"Esperado: '{expected_type}', recibido: '{payload.get('type')}'"
            )
            return None

        if not payload.get("sub"):
            logger.warning("Token sin campo 'sub'.")
            return None

        payload["sub"] = int(payload["sub"])
        return payload

    except ExpiredSignatureError:
        logger.debug(f"Token '{expected_type}' expirado.")
        return None
    except JWTError as e:
        logger.warning(f"Token JWT inválido ('{expected_type}'): {e}")
        return None


# ── Verificadores públicos ────────────────────────────────────────
def verify_access_token(token: str) -> dict[str, Any] | None:
    """
    Verifica y decodifica un access token.
    Retorna el payload o None si es inválido/expirado.
    """
    return _decode_token(token, ACCESS_TOKEN_TYPE)


def verify_refresh_token(token: str) -> dict[str, Any] | None:
    """
    Verifica y decodifica un refresh token.
    Retorna el payload o None si es inválido/expirado.
    """
    return _decode_token(token, REFRESH_TOKEN_TYPE)


def decode_token_unverified(token: str) -> dict[str, Any] | None:
    """
    Decodifica un token SIN verificar firma ni expiración.
    SOLO para debugging — nunca para autenticar.
    """
    try:
        return jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False},
            algorithms=[settings.ALGORITHM],
            key=settings.SECRET_KEY,
        )
    except JWTError:
        return None