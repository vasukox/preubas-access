"""
KOAJ Access v2.0 — Permoda S.A.S.
Router de autenticación

Endpoints:
  POST /auth/login            → Login con email y contraseña
  POST /auth/refresh          → Rotar refresh token
  POST /auth/logout           → Revocar todos los tokens
  POST /auth/cambiar-password → Cambiar contraseña
  GET  /auth/me               → Perfil del usuario autenticado
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.usuario import Usuario
from app.schemas.auth import (
    CambiarPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    TokenResponse,
    UsuarioMeResponse,
    RolResponse,
)
from app.schemas.common import ApiResponse, ok, err
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _build_usuario_response(usuario: Usuario) -> UsuarioMeResponse:
    """
    Construye el UsuarioMeResponse desde el ORM.
    Separado para reutilizarlo en login y en /me.
    """
    return UsuarioMeResponse(
        id                    = usuario.id,
        email                 = usuario.email,
        nombre_completo       = usuario.nombre_completo,
        activo                = usuario.activo,
        debe_cambiar_password = usuario.debe_cambiar_password,
        ultimo_login          = usuario.ultimo_login,
        roles                 = [
            RolResponse(id=ur.rol.id, nombre=ur.rol.nombre)
            for ur in usuario.roles
        ],
    )


# ── POST /auth/login ──────────────────────────────────────────────
@router.post(
    "/login",
    response_model=ApiResponse[LoginResponse],
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión",
)
async def login(
    body:    LoginRequest,
    request: Request,
    db:      AsyncSession = Depends(get_db),
) -> ApiResponse[LoginResponse]:
    """
    Autentica al usuario y retorna el par de tokens + perfil.

    - Bloquea la cuenta tras 5 intentos fallidos por 15 minutos.
    - Si debe_cambiar_password es True, el frontend debe
      redirigir a CambiarPasswordView antes de continuar.
    """
    try:
        service = AuthService(db)
        result  = await service.login(
            email      = body.email,
            password   = body.password,
            user_agent = request.headers.get("user-agent"),
            ip_address = request.client.host if request.client else None,
        )
        return ok(LoginResponse(
            tokens=TokenResponse(
                access_token          = result.access_token,
                refresh_token         = result.refresh_token,
                debe_cambiar_password = result.debe_cambiar_password,
            ),
            usuario=_build_usuario_response(result.usuario),
        ))
    except ValueError as e:
        err("AUTH_ERROR", str(e), 401)


# ── POST /auth/refresh ────────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Rotar refresh token",
)
async def refresh(
    body:    RefreshRequest,
    request: Request,
    db:      AsyncSession = Depends(get_db),
) -> ApiResponse[TokenResponse]:
    """
    Rota el refresh token y emite un nuevo par de tokens.
    El token anterior queda revocado inmediatamente.
    """
    try:
        service = AuthService(db)
        result  = await service.refresh(
            refresh_token_str = body.refresh_token,
            user_agent        = request.headers.get("user-agent"),
            ip_address        = request.client.host if request.client else None,
        )
        return ok(TokenResponse(
            access_token          = result.access_token,
            refresh_token         = result.refresh_token,
            debe_cambiar_password = False,
        ))
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 401)


# ── POST /auth/logout ─────────────────────────────────────────────
@router.post(
    "/logout",
    response_model=ApiResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Cerrar sesión",
)
async def logout(
    db:             AsyncSession       = Depends(get_db),
    current_user:   Usuario            = Depends(get_current_user),
) -> ApiResponse[None]:
    """
    Revoca todos los refresh tokens activos del usuario.
    El access token expira naturalmente (es stateless).
    """
    service = AuthService(db)
    await service.logout(current_user.id)
    return ok(None, message="Sesión cerrada correctamente.")


# ── POST /auth/cambiar-password ───────────────────────────────────
@router.post(
    "/cambiar-password",
    response_model=ApiResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Cambiar contraseña",
)
async def cambiar_password(
    body:           CambiarPasswordRequest,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
) -> ApiResponse[None]:
    """
    Cambia la contraseña del usuario autenticado.

    - Verifica la contraseña actual.
    - Valida fortaleza de la nueva.
    - Revoca tokens de otros dispositivos al finalizar.
    - Marca debe_cambiar_password = False.
    """
    try:
        service = AuthService(db)
        await service.cambiar_password(
            usuario_id      = current_user.id,
            password_actual = body.password_actual,
            password_nueva  = body.password_nueva,
        )
        return ok(None, message="Contraseña actualizada correctamente.")
    except ValueError as e:
        err("PASSWORD_ERROR", str(e), 400)

# esta parte hace lo mismo que el login pero sin tokens y sin refresh token 
# ── GET /auth/me ──────────────────────────────────────────────────
@router.get(
    "/me",
    response_model=ApiResponse[UsuarioMeResponse],
    status_code=status.HTTP_200_OK,
    summary="Perfil del usuario autenticado",
)
async def get_me(
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
) -> ApiResponse[UsuarioMeResponse]:
    """
    Retorna el perfil completo del usuario autenticado.
    Útil para refrescar el estado del frontend sin hacer login.
    """
    try:
        service = AuthService(db)
        usuario = await service.get_me(current_user.id)
        return ok(_build_usuario_response(usuario))
    except ValueError as e:
        err("USER_ERROR", str(e), 404)