"""
KOAJ Access v2.0 — Permoda S.A.S.
Repositorio de usuarios y autenticación.

Extiende BaseRepository con consultas específicas de:
  - Usuario: buscar por email, verificar bloqueo, actualizar login
  - RefreshToken: crear, rotar, revocar por JTI
"""

from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.usuario import Usuario, Rol, UsuarioRol, RefreshToken
from app.repositories.base import BaseRepository


# ── Usuario Repository ────────────────────────────────────────────
class UsuarioRepository(BaseRepository[Usuario]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Usuario, db)

    async def get_by_email(self, email: str) -> Usuario | None:
        """
        Busca un usuario activo por email sin cargar roles.
        """
        result = await self._db.execute(
            select(Usuario)
            .where(
                Usuario.email      == email.lower().strip(),
                Usuario.deleted_at == None,  # noqa: E711
            )
        )
        return result.scalar_one_or_none()

    async def get_by_email_with_roles(self, email: str) -> Usuario | None:
        """
        Busca un usuario por email cargando roles y el detalle
        de cada rol explícitamente (evita lazy load en async).
        Usado en login y /auth/me.
        """
        result = await self._db.execute(
            select(Usuario)
            .options(
                selectinload(Usuario.roles).selectinload(UsuarioRol.rol)
            )
            .where(
                Usuario.email      == email.lower().strip(),
                Usuario.deleted_at == None,  # noqa: E711
                Usuario.activo     == True,  # noqa: E712
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_roles(self, usuario_id: int) -> Usuario | None:
        """
        Busca un usuario por ID cargando roles explícitamente.
        Usado en refresh token y /auth/me.
        """
        result = await self._db.execute(
            select(Usuario)
            .options(
                selectinload(Usuario.roles).selectinload(UsuarioRol.rol)
            )
            .where(
                Usuario.id         == usuario_id,
                Usuario.deleted_at == None,  # noqa: E711
            )
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """
        Verifica si un email ya está registrado (activo o no).
        Usado al crear usuarios para evitar duplicados.
        """
        return await self.exists(
            Usuario.email == email.lower().strip()
        )

    async def registrar_login_exitoso(self, usuario_id: int) -> None:
        """
        Actualiza ultimo_login y resetea intentos_fallidos.
        """
        await self._db.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(
                ultimo_login      = datetime.now(timezone.utc),
                intentos_fallidos = 0,
                bloqueado_hasta   = None,
            )
        )

    async def registrar_intento_fallido(
        self,
        usuario_id:      int,
        nuevo_contador:  int,
        bloqueado_hasta: datetime | None = None,
    ) -> None:
        """
        Incrementa el contador de intentos fallidos.
        Si se supera el límite, establece bloqueado_hasta.
        """
        await self._db.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(
                intentos_fallidos = nuevo_contador,
                bloqueado_hasta   = bloqueado_hasta,
            )
        )

    async def marcar_password_cambiado(self, usuario_id: int) -> None:
        """
        Marca debe_cambiar_password = False.
        """
        await self._db.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(debe_cambiar_password=False)
        )

    async def actualizar_password(
        self,
        usuario_id:    int,
        password_hash: str,
    ) -> None:
        """
        Actualiza el hash de contraseña y desactiva el flag
        de cambio obligatorio.
        """
        await self._db.execute(
            update(Usuario)
            .where(Usuario.id == usuario_id)
            .values(
                password_hash         = password_hash,
                debe_cambiar_password = False,
            )
        )


# ── Rol Repository ────────────────────────────────────────────────
class RolRepository(BaseRepository[Rol]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Rol, db)

    async def get_by_nombre(self, nombre: str) -> Rol | None:
        """Busca un rol por su nombre exacto."""
        result = await self._db.execute(
            select(Rol).where(
                Rol.nombre     == nombre,
                Rol.deleted_at == None,  # noqa: E711
            )
        )
        return result.scalar_one_or_none()

    async def get_activos(self) -> list[Rol]:
        """Retorna todos los roles activos."""
        result = await self._db.execute(
            select(Rol).where(
                Rol.activo     == True,  # noqa: E712
                Rol.deleted_at == None,  # noqa: E711
            )
        )
        return list(result.scalars().all())


# ── RefreshToken Repository ───────────────────────────────────────
class RefreshTokenRepository(BaseRepository[RefreshToken]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RefreshToken, db)

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        """
        Busca un refresh token por su JTI.
        Retorna None si no existe, está revocado o expiró.
        """
        now = datetime.now(timezone.utc)
        result = await self._db.execute(
            select(RefreshToken).where(
                RefreshToken.jti       == jti,
                RefreshToken.revocado  == False,  # noqa: E712
                RefreshToken.expira_en >  now,
                RefreshToken.deleted_at == None,  # noqa: E711
            )
        )
        return result.scalar_one_or_none()

    async def revocar_por_jti(self, jti: str) -> None:
        """Revoca un token específico por JTI."""
        await self._db.execute(
            update(RefreshToken)
            .execution_options(synchronize_session=False)
            .where(RefreshToken.jti == jti)
            .values(revocado=True)
        )

    async def revocar_todos_del_usuario(self, usuario_id: int) -> None:
        """
        Revoca TODOS los tokens activos de un usuario.
        Usado en logout y actividad sospechosa.
        """
        await self._db.execute(
            update(RefreshToken)
            .execution_options(synchronize_session=False)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revocado   == False,  # noqa: E712
            )
            .values(revocado=True)
        )

    async def limpiar_expirados(self, usuario_id: int) -> None:
        """
        Soft-delete de tokens expirados de un usuario en una sola query bulk.
        Se llama después de cada login exitoso.
        """
        now = datetime.now(timezone.utc)
        await self._db.execute(
            update(RefreshToken)
            .execution_options(synchronize_session=False)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.expira_en  <  now,
                RefreshToken.deleted_at == None,  # noqa: E711
            )
            .values(deleted_at=now)
        )