"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Utilidades para manejo de tokens JWT.

Responsabilidades:
- Crear access tokens (duración corta: 30 min)
- Crear refresh tokens (duración larga: 7 días)
- Verificar y decodificar tokens
- Detectar tokens expirados vs inválidos

Patrón:
    Solo este módulo conoce el SECRET_KEY y el ALGORITHM.
    Nadie más debe importar jose directamente.
    dependencies.py usa verify_access_token() para autenticar.
    auth_service.py usa create_access_token() y create_refresh_token().
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, ExpiredSignatureError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

# ── Tipos de token ────────────────────────────────────────────────────
ACCESS_TOKEN_TYPE  = "access"
REFRESH_TOKEN_TYPE = "refresh"


# ── Crear tokens ──────────────────────────────────────────────────────
def create_access_token(
    subject: int,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Crea un access token JWT de corta duración.

    El access token se envía en cada request autenticado
    en el header: Authorization: Bearer <token>

    Args:
        subject:      ID del usuario (se guarda en el claim 'sub')
        extra_claims: Claims adicionales opcionales (ej: sede_activa_id)

    Returns:
        Token JWT firmado como string
    """
    now    = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub":  str(subject),
        "type": ACCESS_TOKEN_TYPE,
        "iat":  now,
        "exp":  expire,
    }

    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug(f"Access token creado para usuario_id={subject}, expira={expire.isoformat()}")
    return token


def create_refresh_token(subject: int) -> str:
    """
    Crea un refresh token JWT de larga duración.

    El refresh token SOLO se usa para obtener nuevos access tokens
    en el endpoint POST /api/v1/auth/refresh.
    No debe enviarse en requests normales.

    Args:
        subject: ID del usuario

    Returns:
        Token JWT firmado como string
    """
    now    = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub":  str(subject),
        "type": REFRESH_TOKEN_TYPE,
        "iat":  now,
        "exp":  expire,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.debug(f"Refresh token creado para usuario_id={subject}, expira={expire.isoformat()}")
    return token


# ── Función privada de decodificación (DRY) ───────────────────────────
def _decode_token(token: str, expected_type: str) -> dict[str, Any] | None:
    """
    Función interna reutilizable para verificar y decodificar tokens.

    Centraliza la lógica común de verify_access_token()
    y verify_refresh_token() — principio DRY.

    Args:
        token:         Token JWT como string
        expected_type: Tipo esperado ('access' o 'refresh')

    Returns:
        Dict con el payload decodificado si es válido, None si no
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Verificar que sea del tipo correcto
        if payload.get("type") != expected_type:
            logger.warning(
                f"Tipo de token incorrecto. "
                f"Esperado: '{expected_type}', recibido: '{payload.get('type')}'"
            )
            return None

        # Verificar que tenga el campo sub
        if not payload.get("sub"):
            logger.warning("Token sin campo 'sub'.")
            return None

        # Convertir sub a int para consistencia con los IDs de la BD
        payload["sub"] = int(payload["sub"])
        return payload

    except ExpiredSignatureError:
        logger.debug(f"Token de tipo '{expected_type}' expirado.")
        return None
    except JWTError as e:
        logger.warning(f"Token JWT inválido (tipo '{expected_type}'): {e}")
        return None


# ── Verificar tokens (usan _decode_token internamente) ────────────────
def verify_access_token(token: str) -> dict[str, Any] | None:
    """
    Verifica y decodifica un access token.

    Valida firma, expiración y que sea de tipo 'access'.

    Args:
        token: Token JWT como string

    Returns:
        Dict con el payload decodificado si es válido, None si no

    Ejemplo:
        payload = verify_access_token(token)
        if payload is None:
            raise HTTPException(401, "Token inválido")
        usuario_id = payload["sub"]  # Ya es int
    """
    return _decode_token(token, ACCESS_TOKEN_TYPE)


def verify_refresh_token(token: str) -> dict[str, Any] | None:
    """
    Verifica y decodifica un refresh token.

    Valida firma, expiración y que sea de tipo 'refresh'.

    Args:
        token: Refresh token JWT como string

    Returns:
        Dict con el payload decodificado si es válido, None si no

    Uso en auth_service.py:
        payload = verify_refresh_token(refresh_token)
        if payload is None:
            err("REFRESH_TOKEN_INVALIDO", "...", 401)
        usuario_id = payload["sub"]
    """
    return _decode_token(token, REFRESH_TOKEN_TYPE)


def decode_token_unverified(token: str) -> dict[str, Any] | None:
    """
    Decodifica un token SIN verificar la firma ni la expiración.

    ⚠️  SOLO usar para debugging o para leer el payload de un token
    expirado y saber a qué usuario pertenecía.
    NUNCA usar para autenticar.

    Args:
        token: Token JWT como string

    Returns:
        Dict con el payload o None si el token está malformado
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