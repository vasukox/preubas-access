"""
KOAJ Access v2.0 — Permoda S.A.S.
Dependencias globales de FastAPI — async

Responsabilidades:
  - Extraer y validar el JWT de cada request autenticado
  - Proveer el usuario autenticado a los routers
  - Validar roles y permisos por endpoint
  - Validar API Keys para hardware externo (cámara LPR, lector NFC)

Jerarquía de dependencias:
    get_current_user          → Cualquier usuario autenticado
    require_role(...)         → Usuario con rol específico
    require_permiso(operacion)→ Usuario con permiso granular (ver/crear/editar/eliminar)
    get_lpr_api_key           → Hardware externo LPR
    get_nfc_api_key           → Hardware externo NFC
"""

import logging
from typing import Callable

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

logger = logging.getLogger(__name__)


# ── Esquemas de seguridad ─────────────────────────────────────────
bearer_scheme = HTTPBearer(
    scheme_name="JWT Bearer",
    description="Token JWT obtenido desde POST /api/v1/auth/login",
    auto_error=True,
)

lpr_api_key_scheme = APIKeyHeader(
    name="X-LPR-API-Key",
    description="API Key de la cámara LPR del parqueadero",
    auto_error=True,
)

nfc_api_key_scheme = APIKeyHeader(
    name="X-NFC-API-Key",
    description="API Key del lector fijo NFC de activos",
    auto_error=True,
)


# ── Validador privado de API Keys de hardware ─────────────────────
def _validate_hardware_key(
    api_key:      str,
    expected_key: str,
    service_name: str,
) -> str:
    """
    Valida una API Key de hardware externo.
    Reutilizado por get_lpr_api_key y get_nfc_api_key (DRY).

    Raises:
        403 — Clave no configurada o incorrecta.
    """
    if not expected_key:
        logger.warning(f"{service_name} API Key no está configurada en .env")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code":    "API_KEY_NO_CONFIGURADA",
                    "message": f"El servicio {service_name} no está configurado.",
                },
            },
        )

    if api_key != expected_key:
        logger.warning(
            f"Intento de acceso {service_name} con API Key inválida: "
            f"{api_key[:8]}..."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code":    "API_KEY_INVALIDA",
                    "message": f"La API Key de {service_name} no es válida.",
                },
            },
        )

    return api_key


# ── Usuario autenticado ───────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db:          AsyncSession                 = Depends(get_db),
):
    """
    Dependencia principal de autenticación.

    Extrae el Bearer token, lo valida y retorna el Usuario ORM activo.

    Raises:
        401 — Token inválido, expirado o malformado.
        401 — Usuario no encontrado en BD.
        403 — Usuario inactivo.
    """
    from app.models.usuario import Usuario, UsuarioRol
    from app.utils.jwt import verify_access_token
    from sqlalchemy.orm import selectinload

    payload = verify_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code":    "TOKEN_INVALIDO",
                    "message": "El token es inválido o ha expirado.",
                },
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario_id: int | None = payload.get("sub")
    if not isinstance(usuario_id, int):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code":    "TOKEN_MALFORMADO",
                    "message": "El token no contiene información de usuario válida.",
                },
            },
        )

    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.roles).selectinload(UsuarioRol.rol)
        )
        .where(
            Usuario.id         == usuario_id,
            Usuario.deleted_at.is_(None),
        )
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code":    "USUARIO_NO_ENCONTRADO",
                    "message": "El usuario asociado a este token no existe.",
                },
            },
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code":    "USUARIO_INACTIVO",
                    "message": "Tu cuenta ha sido desactivada. Contacta al administrador.",
                },
            },
        )

    return usuario


# ── Control de roles ──────────────────────────────────────────────
def require_role(*roles: str) -> Callable:
    """
    Factory de dependencias para control de acceso por rol.

    Verifica que el usuario tenga AL MENOS UNO de los roles indicados.
    ADMIN_GLOBAL siempre tiene acceso completo a todo.

    Uso:
        @router.get(
            "/hse/admin",
            dependencies=[Depends(require_role("ADMIN_HSE", "ADMIN_GLOBAL"))]
        )
    """
    async def _check_role(usuario=Depends(get_current_user)):
        roles_del_usuario = {r.rol.nombre for r in usuario.roles}

        if "ADMIN_GLOBAL" in roles_del_usuario:
            return usuario

        if not roles_del_usuario.intersection(set(roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code":    "SIN_PERMISOS",
                        "message": (
                            f"No tienes permisos para esta acción. "
                            f"Se requiere uno de: {', '.join(roles)}"
                        ),
                    },
                },
            )
        return usuario

    return _check_role


# ── Control de permisos granulares ───────────────────────────────
def require_permiso(operacion: str) -> Callable:
    """
    Factory de dependencias para control de acceso por permiso granular.

    Verifica que el usuario tenga el permiso para la operación dada.
    Operaciones válidas: "ver", "crear", "editar", "eliminar"
    ADMIN_GLOBAL siempre tiene acceso completo (bypass automático).

    Uso:
        @router.delete(
            "/hse/autorizaciones/{id}",
            dependencies=[
                Depends(require_role("ADMIN_HSE", "GESTION_HSE")),
                Depends(require_permiso("eliminar")),
            ]
        )
    """
    async def _check_permiso(
        usuario: "Usuario" = Depends(get_current_user),
        db:      "AsyncSession" = Depends(get_db),
    ):
        from app.models.usuario import RolNombre, UsuarioPermiso
        from sqlalchemy import select

        roles_del_usuario = {r.rol.nombre for r in usuario.roles}

        # ADMIN_GLOBAL siempre pasa
        if RolNombre.ADMIN_GLOBAL in roles_del_usuario:
            return usuario

        result = await db.execute(
            select(UsuarioPermiso).where(UsuarioPermiso.usuario_id == usuario.id)
        )
        permiso = result.scalar_one_or_none()

        if not permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code":    "SIN_PERMISOS_CONFIGURADOS",
                        "message": "Tu cuenta no tiene permisos configurados. Contacta al administrador.",
                    },
                },
            )

        campo = f"puede_{operacion}"
        if not getattr(permiso, campo, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code":    "PERMISO_DENEGADO",
                        "message": f"No tienes permiso para '{operacion}' en este módulo.",
                    },
                },
            )

        return usuario

    return _check_permiso


# ── API Keys hardware ─────────────────────────────────────────────
def get_lpr_api_key(
    api_key: str = Security(lpr_api_key_scheme),
) -> str:
    """
    Valida la API Key de la cámara LPR del parqueadero.
    Responde en < 200ms — no hace queries a BD.
    """
    return _validate_hardware_key(api_key, settings.LPR_API_KEY, "LPR")


def get_nfc_api_key(
    api_key: str = Security(nfc_api_key_scheme),
) -> str:
    """
    Valida la API Key del lector fijo NFC de activos.
    Responde en < 300ms — no hace queries a BD.
    """
    return _validate_hardware_key(api_key, settings.NFC_READER_API_KEY, "NFC")


# ── Token público (portales de autogestión) ───────────────────────
def get_public_token(token: str) -> str:
    """
    Valida el token UUID de los portales públicos de autogestión.

    La validación de existencia y expiración se hace en el
    service correspondiente (hse_service, parking_service).

    Raises:
        400 — Token no proporcionado.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code":    "TOKEN_REQUERIDO",
                    "message": "El token de acceso es requerido.",
                },
            },
        )
    return token.strip()