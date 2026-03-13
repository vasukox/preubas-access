"""
KOAJ Access v2.0 — Permoda S.A.S.
Auth Service

Responsabilidades:
  - Login con validación de credenciales y bloqueo por intentos
  - Emisión de access token + refresh token
  - Rotación de refresh token (no se reutiliza)
  - Logout (revocación de todos los tokens)
  - Cambio de contraseña
  - Perfil del usuario autenticado (/auth/me)

Reglas de negocio:
  - Máximo 5 intentos fallidos → bloqueo 15 minutos
  - Refresh token se rota en cada uso
  - Al cambiar password → se revocan tokens de otros dispositivos
  - debe_cambiar_password = True → flag en token para
    que frontend redirija a CambiarPasswordView
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usuario import RefreshToken, Usuario
from app.repositories.usuario_repository import (
    RefreshTokenRepository,
    UsuarioRepository,
)
from app.utils.jwt import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.utils.password import hash_password, verify_password, validate_password_strength

# ── Constantes ────────────────────────────────────────────────────
MAX_INTENTOS_FALLIDOS: int = 5
MINUTOS_BLOQUEO:       int = 15
DIAS_REFRESH_TOKEN:    int = 7


# ── Resultados tipados ────────────────────────────────────────────
@dataclass
class LoginResult:
    access_token:          str
    refresh_token:         str
    usuario:               Usuario
    debe_cambiar_password: bool


@dataclass
class RefreshResult:
    access_token:  str
    refresh_token: str


# ── Servicio ──────────────────────────────────────────────────────
class AuthService:
    """
    Servicio de autenticación de KOAJ Access.

    Patrón: instanciar con una sesión de BD por request.
        service = AuthService(db)
        result  = await service.login(email, password, ...)
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db           = db
        self._usuario_repo = UsuarioRepository(db)
        self._token_repo   = RefreshTokenRepository(db)

    # ─────────────────────────────────────────────────────────────
    # LOGIN
    # ─────────────────────────────────────────────────────────────
    async def login(
        self,
        email:      str,
        password:   str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> LoginResult:
        """
        Autentica un usuario con email y contraseña.

        Flujo:
          1. Buscar usuario por email
          2. Verificar cuenta activa
          3. Verificar bloqueo por intentos fallidos
          4. Verificar contraseña
          5. Si falla → incrementar contador, bloquear si supera límite
          6. Si éxito → emitir tokens, registrar login, limpiar expirados

        Raises:
            ValueError: mensaje legible para mostrar en el frontend.
        """

        # 1. Buscar usuario — mismo mensaje si no existe o inactivo
        #    para no revelar si el email está registrado
        usuario = await self._usuario_repo.get_by_email_with_roles(email)
        if not usuario or not usuario.activo:
            raise ValueError("Credenciales incorrectas.")

        # 2. Verificar bloqueo
        if usuario.bloqueado_hasta:
            now = datetime.now(timezone.utc)
            bloqueado_hasta = usuario.bloqueado_hasta.replace(tzinfo=timezone.utc)
            if bloqueado_hasta > now:
                minutos_restantes = int(
                    (bloqueado_hasta - now).total_seconds() / 60
                ) + 1
                raise ValueError(
                    f"Cuenta bloqueada por intentos fallidos. "
                    f"Intenta de nuevo en {minutos_restantes} minuto(s)."
                )

        # 3. Verificar contraseña
        if not verify_password(password, usuario.password_hash):
            nuevo_contador  = usuario.intentos_fallidos + 1
            bloqueado_hasta = None

            if nuevo_contador >= MAX_INTENTOS_FALLIDOS:
                bloqueado_hasta = datetime.now(timezone.utc) + timedelta(
                    minutes=MINUTOS_BLOQUEO
                )

            await self._usuario_repo.registrar_intento_fallido(
                usuario_id      = usuario.id,
                nuevo_contador  = nuevo_contador,
                bloqueado_hasta = bloqueado_hasta,
            )
            await self._db.commit()

            restantes = MAX_INTENTOS_FALLIDOS - nuevo_contador
            if restantes > 0:
                raise ValueError(
                    f"Credenciales incorrectas. "
                    f"Te quedan {restantes} intento(s) antes del bloqueo."
                )
            raise ValueError(
                f"Cuenta bloqueada por {MINUTOS_BLOQUEO} minutos "
                "por múltiples intentos fallidos."
            )

        # 4. Credenciales correctas — construir tokens
        roles_nombres = [ur.rol.nombre for ur in usuario.roles]
        jti           = str(uuid.uuid4())

        access_token      = create_access_token(
            usuario_id            = usuario.id,
            email                 = usuario.email,
            roles                 = roles_nombres,
            debe_cambiar_password = usuario.debe_cambiar_password,
        )
        refresh_token_str = create_refresh_token(
            usuario_id = usuario.id,
            jti        = jti,
        )

        # 5. Persistir refresh token
        expira_en = datetime.now(timezone.utc) + timedelta(days=DIAS_REFRESH_TOKEN)
        token_obj = RefreshToken(
            usuario_id = usuario.id,
            jti        = jti,
            revocado   = False,
            expira_en  = expira_en,
            user_agent = user_agent,
            ip_address = ip_address,
        )
        await self._token_repo.create(token_obj)

        # 6. Registrar login exitoso + limpiar tokens expirados
        await self._usuario_repo.registrar_login_exitoso(usuario.id)
        await self._token_repo.limpiar_expirados(usuario.id)
        await self._db.commit()

        return LoginResult(
            access_token          = access_token,
            refresh_token         = refresh_token_str,
            usuario               = usuario,
            debe_cambiar_password = usuario.debe_cambiar_password,
        )

    # ─────────────────────────────────────────────────────────────
    # REFRESH
    # ─────────────────────────────────────────────────────────────
    async def refresh(
        self,
        refresh_token_str: str,
        user_agent:        str | None = None,
        ip_address:        str | None = None,
    ) -> RefreshResult:
        """
        Rota el refresh token y emite un nuevo par de tokens.

        Seguridad: si el JTI no existe en BD (ya fue revocado),
        se revocan TODOS los tokens del usuario — posible reuso malicioso.

        Raises:
            ValueError: token inválido, expirado o revocado.
        """

        # 1. Verificar firma JWT
        payload = verify_refresh_token(refresh_token_str)
        if not payload:
            raise ValueError("Refresh token inválido o expirado.")

        jti        = payload.get("jti")
        usuario_id = payload.get("sub")

        if not jti or not usuario_id:
            raise ValueError("Refresh token malformado.")

        # 2. Verificar en BD
        token_obj = await self._token_repo.get_by_jti(jti)
        if not token_obj:
            # Posible reuso malicioso — revocar todo
            await self._token_repo.revocar_todos_del_usuario(int(usuario_id))
            await self._db.commit()
            raise ValueError(
                "Refresh token inválido. Sesión cerrada por seguridad."
            )

        # 3. Revocar token viejo
        await self._token_repo.revocar_por_jti(jti)

        # 4. Cargar usuario actualizado
        usuario = await self._usuario_repo.get_by_id_with_roles(int(usuario_id))
        if not usuario or not usuario.activo:
            raise ValueError("Usuario no encontrado o inactivo.")

        # 5. Emitir nuevos tokens
        nuevo_jti          = str(uuid.uuid4())
        roles_nombres      = [ur.rol.nombre for ur in usuario.roles]
        nuevo_access_token = create_access_token(
            usuario_id            = usuario.id,
            email                 = usuario.email,
            roles                 = roles_nombres,
            debe_cambiar_password = usuario.debe_cambiar_password,
        )
        nuevo_refresh_str = create_refresh_token(
            usuario_id = usuario.id,
            jti        = nuevo_jti,
        )

        # 6. Persistir nuevo refresh token
        expira_en = datetime.now(timezone.utc) + timedelta(days=DIAS_REFRESH_TOKEN)
        await self._token_repo.create(RefreshToken(
            usuario_id = usuario.id,
            jti        = nuevo_jti,
            revocado   = False,
            expira_en  = expira_en,
            user_agent = user_agent,
            ip_address = ip_address,
        ))
        await self._db.commit()

        return RefreshResult(
            access_token  = nuevo_access_token,
            refresh_token = nuevo_refresh_str,
        )

    # ─────────────────────────────────────────────────────────────
    # LOGOUT
    # ─────────────────────────────────────────────────────────────
    async def logout(self, usuario_id: int) -> None:
        """
        Revoca todos los refresh tokens activos del usuario.
        El access token expira naturalmente — es stateless.
        """
        await self._token_repo.revocar_todos_del_usuario(usuario_id)
        await self._db.commit()

    # ─────────────────────────────────────────────────────────────
    # CAMBIAR CONTRASEÑA
    # ─────────────────────────────────────────────────────────────
    async def cambiar_password(
        self,
        usuario_id:      int,
        password_actual: str,
        password_nueva:  str,
    ) -> None:
        """
        Cambia la contraseña del usuario autenticado.

        Flujo:
          1. Cargar usuario
          2. Verificar contraseña actual
          3. Validar fortaleza de la nueva
          4. Hashear y guardar
          5. Revocar tokens de otros dispositivos
          6. Marcar debe_cambiar_password = False

        Raises:
            ValueError: mensaje legible para el frontend.
        """

        usuario = await self._usuario_repo.get_by_id(usuario_id)
        if not usuario:
            raise ValueError("Usuario no encontrado.")

        if not verify_password(password_actual, usuario.password_hash):
            raise ValueError("La contraseña actual es incorrecta.")

        resultado = validate_password_strength(password_nueva)
        if not resultado.is_valid:
            raise ValueError(f"Contraseña inválida: {', '.join(resultado.errors)}")

        nuevo_hash = hash_password(password_nueva)
        await self._usuario_repo.actualizar_password(usuario.id, nuevo_hash)
        await self._token_repo.revocar_todos_del_usuario(usuario.id)
        await self._db.commit()

    # ─────────────────────────────────────────────────────────────
    # PERFIL
    # ─────────────────────────────────────────────────────────────
    async def get_me(self, usuario_id: int) -> Usuario:
        """
        Retorna el perfil completo del usuario autenticado.
        Usado en GET /auth/me.
        """
        usuario = await self._usuario_repo.get_by_id_with_roles(usuario_id)
        if not usuario or not usuario.activo:
            raise ValueError("Usuario no encontrado o inactivo.")
        return usuario