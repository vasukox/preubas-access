"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Dependencias globales de FastAPI.

Responsabilidades:
- Extraer y validar el JWT de cada request autenticado
- Proveer el usuario autenticado a los routers
- Validar roles y permisos por endpoint
- Validar API Keys para hardware externo (cámara LPR, lector NFC)

Patrón:
    Todos los routers que requieren autenticación usan estas
    dependencias con Depends(). Nunca validan el token manualmente.

Jerarquía de dependencias:
    get_current_user         → Cualquier usuario autenticado
    require_role(...)        → Usuario con rol específico
    get_lpr_api_key          → Hardware externo LPR
    get_nfc_api_key          → Hardware externo NFC
"""

import logging
from typing import Callable
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)

# ── Esquemas de seguridad ─────────────────────────────────────────────
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


# ── Función privada DRY para validar API Keys de hardware ─────────────
def _validate_hardware_key(
    api_key: str,
    expected_key: str,
    service_name: str,
) -> str:
    """
    Valida una API Key de hardware externo.

    Función privada reutilizada por get_lpr_api_key() y
    get_nfc_api_key() para evitar duplicación de código (DRY).

    Args:
        api_key:      API Key recibida en el header
        expected_key: API Key esperada desde settings
        service_name: Nombre del servicio (para logs y mensajes de error)

    Returns:
        La API Key si es válida

    Raises:
        403 — Si la clave no está configurada o es incorrecta
    """
    if not expected_key:
        logger.warning(f"{service_name} API Key no está configurada en .env")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "API_KEY_NO_CONFIGURADA",
                    "message": f"El servicio {service_name} no está configurado correctamente.",
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
                    "code": "API_KEY_INVALIDA",
                    "message": f"La API Key de {service_name} no es válida.",
                },
            },
        )

    return api_key


# ── Usuario autenticado ───────────────────────────────────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Dependencia principal de autenticación.

    Extrae el Bearer token del header Authorization,
    lo valida con jwt.py y retorna el usuario ORM activo.

    NOTE: La query directa a Usuario se refactorizará a
          UsuarioRepository.find_by_id() en Sprint 1
          cuando el repositorio esté implementado.

    Raises:
        401 — Token inválido, expirado o malformado
        401 — Usuario no encontrado en la BD
        403 — Usuario inactivo (desactivado por admin)

    Uso:
        @router.get("/mi-endpoint")
        def endpoint(usuario = Depends(get_current_user)):
            return usuario.nombre
    """
    from app.utils.jwt import verify_access_token
    from app.models.usuario import Usuario

    token = credentials.credentials

    # Verificar y decodificar el token
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "TOKEN_INVALIDO",
                    "message": "El token es inválido o ha expirado. Inicia sesión nuevamente.",
                },
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # sub ya viene como int desde verify_access_token (fix de tipado)
    usuario_id: int | None = payload.get("sub")
    if not isinstance(usuario_id, int):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "TOKEN_MALFORMADO",
                    "message": "El token no contiene información de usuario válida.",
                },
            },
        )

    # Verificar que el usuario existe y está activo
    # TODO Sprint 1: refactorizar a UsuarioRepository.find_by_id(usuario_id)
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.deleted_at.is_(None),
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "USUARIO_NO_ENCONTRADO",
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
                    "code": "USUARIO_INACTIVO",
                    "message": "Tu cuenta ha sido desactivada. Contacta al administrador.",
                },
            },
        )

    return usuario


# ── Control de roles ──────────────────────────────────────────────────
def require_role(*roles: str) -> Callable:
    """
    Factory de dependencias para control de acceso por rol.

    Verifica que el usuario tenga AL MENOS UNO de los roles
    indicados. ADMIN_GLOBAL siempre tiene acceso a todo.

    Args:
        *roles: Nombres de roles permitidos.

    Returns:
        Dependencia de FastAPI que valida el rol.

    Raises:
        403 — El usuario no tiene ninguno de los roles requeridos.

    Uso:
        @router.get(
            "/parking/admin",
            dependencies=[Depends(require_role("ADMIN_PARKING", "ADMIN_GLOBAL"))]
        )
        def panel_admin():
            ...
    """
    def _check_role(usuario=Depends(get_current_user)):
        roles_del_usuario = {r.rol.nombre for r in usuario.roles}

        # ADMIN_GLOBAL siempre tiene acceso completo
        if "ADMIN_GLOBAL" in roles_del_usuario:
            return usuario

        roles_requeridos = set(roles)
        if not roles_del_usuario.intersection(roles_requeridos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "SIN_PERMISOS",
                        "message": (
                            f"No tienes permisos para esta acción. "
                            f"Se requiere uno de: {', '.join(roles_requeridos)}"
                        ),
                    },
                },
            )
        return usuario

    return _check_role


# ── API Keys para hardware (usan _validate_hardware_key internamente) ─
def get_lpr_api_key(
    api_key: str = Security(lpr_api_key_scheme),
) -> str:
    """
    Valida la API Key de la cámara LPR del parqueadero.

    La cámara envía este header en cada evento de lectura de placa.
    Responde en < 200ms — no hace queries a la BD.

    Raises:
        403 — API Key inválida o no configurada.
    """
    return _validate_hardware_key(api_key, settings.LPR_API_KEY, "LPR")


def get_nfc_api_key(
    api_key: str = Security(nfc_api_key_scheme),
) -> str:
    """
    Valida la API Key del lector fijo NFC de activos.

    El lector NFC envía este header en cada lectura de chip.
    Responde en < 300ms — no hace queries a la BD.

    Raises:
        403 — API Key inválida o no configurada.
    """
    return _validate_hardware_key(api_key, settings.NFC_READER_API_KEY, "NFC")


# ── Token público (portales de autogestión) ───────────────────────────
def get_public_token(token: str) -> str:
    """
    Extrae y valida el token UUID de los portales públicos.

    Usado en:
    - Portal de autogestión Parking (/parking/solicitud?token=UUID)
    - Portal de autogestión HSE (/hse/autogestion?token=UUID)

    La validación de que el token existe y no expiró se hace
    en el service correspondiente (parking_service / hse_service).

    Raises:
        400 — Token no proporcionado en el query param.
    """
    if not token or len(token.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "TOKEN_REQUERIDO",
                    "message": "El token de acceso es requerido.",
                },
            },
        )
    return token.strip()