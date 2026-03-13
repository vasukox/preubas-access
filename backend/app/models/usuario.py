"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Modelos de usuario, rol y autenticación.

Tablas:
  cat_roles       → catálogo de roles del sistema
  usuarios        → cuentas de acceso al sistema
  usuario_roles   → relación N:M usuario ↔ rol
  refresh_tokens  → tokens de refresco activos por usuario
"""

from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


# ── Constantes de roles ───────────────────────────────────────────
class RolNombre:
    """
    Constantes de los nombres de roles del sistema.
    Evita strings hardcodeados en el código.

    Uso:
        from app.models.usuario import RolNombre
        rol = RolNombre.ADMIN_GLOBAL  # → "ADMIN_GLOBAL"
    """
    ADMIN_GLOBAL      = "ADMIN_GLOBAL"
    ADMIN_PARKING     = "ADMIN_PARKING"
    ADMIN_HSE         = "ADMIN_HSE"
    ADMIN_NFC         = "ADMIN_NFC"
    ADMIN_GH          = "ADMIN_GH"
    VIGILANTE_HSE     = "VIGILANTE_HSE"
    VIGILANTE_PARKING = "VIGILANTE_PARKING"
    VISUALIZADOR      = "VISUALIZADOR"


# ── Catálogo de roles ─────────────────────────────────────────────
class Rol(BaseModel):
    """
    Catálogo de roles del sistema.

    Roles definidos:
      ADMIN_GLOBAL      → acceso total al sistema
      ADMIN_PARKING     → gestión del módulo parking
      ADMIN_HSE         → gestión del módulo HSE
      ADMIN_NFC         → gestión del módulo NFC
      ADMIN_GH          → gestión del módulo gestión humana
      VIGILANTE_HSE     → operación en portería HSE
      VIGILANTE_PARKING → operación en portería parking
      VISUALIZADOR      → solo lectura de reportes y dashboards
    """

    __tablename__ = "cat_roles"

    nombre: Mapped[str] = mapped_column(
        Enum(
            'ADMIN_GLOBAL',
            'ADMIN_PARKING',
            'ADMIN_HSE',
            'ADMIN_NFC',
            'ADMIN_GH',
            'VIGILANTE_HSE',
            'VIGILANTE_PARKING',
            'VISUALIZADOR',
            name='rol_nombre_enum',
        ),
        unique=True,
        nullable=False,
        comment="Nombre único del rol",
    )

    descripcion: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Descripción del rol para mostrar en UI",
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si el rol está activo en el sistema",
    )

    # Relaciones
    usuario_roles: Mapped[list["UsuarioRol"]] = relationship(
        back_populates="rol",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Rol {self.nombre}>"


# ── Usuario ───────────────────────────────────────────────────────
class Usuario(BaseModel):
    """
    Cuenta de acceso al sistema KOAJ Access.

    Un usuario puede tener múltiples roles (relación N:M via UsuarioRol).
    El email es el identificador único de login.
    La contraseña se almacena hasheada con bcrypt.

    Flujo de primer acceso:
      - debe_cambiar_password = True al crear la cuenta
      - El usuario es redirigido a CambiarPasswordView al login
      - Una vez cambiada, debe_cambiar_password = False
    """

    __tablename__ = "usuarios"

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
        comment="Email corporativo — identificador único de login",
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Contraseña hasheada con bcrypt",
    )

    nombre_completo: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Nombre completo para mostrar en UI",
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si la cuenta está habilitada",
    )

    debe_cambiar_password: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="True = redirigir a cambiar password en el próximo login",
    )

    ultimo_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp del último login exitoso",
    )

    intentos_fallidos: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Contador de intentos de login fallidos consecutivos",
    )

    bloqueado_hasta: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Cuenta bloqueada hasta esta fecha por intentos fallidos",
    )

    # Relaciones
    roles: Mapped[list["UsuarioRol"]] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="[UsuarioRol.usuario_id]",
    )

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Usuario {self.email}>"


# ── Relación N:M usuario ↔ rol ────────────────────────────────────
class UsuarioRol(BaseModel):
    """
    Tabla pivot entre Usuario y Rol.
    Permite que un usuario tenga múltiples roles simultáneamente.

    Restricción: un usuario no puede tener el mismo rol dos veces.
    """

    __tablename__ = "usuario_roles"
    __table_args__ = (
        UniqueConstraint("usuario_id", "rol_id", name="uq_usuario_rol"),
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        comment="FK al usuario",
    )

    rol_id: Mapped[int] = mapped_column(
        ForeignKey("cat_roles.id", ondelete="CASCADE"),
        nullable=False,
        comment="FK al rol",
    )

    asignado_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        comment="FK al usuario que asignó este rol",
    )

    # Relaciones
    usuario: Mapped["Usuario"] = relationship(
        back_populates="roles",
        foreign_keys="[UsuarioRol.usuario_id]",
    )

    rol: Mapped["Rol"] = relationship(back_populates="usuario_roles")

    def __repr__(self) -> str:
        return f"<UsuarioRol usuario={self.usuario_id} rol={self.rol_id}>"


# ── Refresh tokens ────────────────────────────────────────────────
class RefreshToken(BaseModel):
    """
    Tokens de refresco activos por usuario.

    Al hacer login se crea un RefreshToken.
    Al hacer refresh se rota: el token viejo se revoca y se crea uno nuevo.
    Al hacer logout se revocan todos los tokens del usuario.

    El campo 'jti' almacena el JWT ID del refresh token (UUID v4),
    no el token completo — para validar sin exponer el secreto.
    """

    __tablename__ = "refresh_tokens"

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="FK al usuario dueño del token",
    )

    jti: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        nullable=False,
        index=True,
        comment="JWT ID único del refresh token (UUID v4)",
    )

    revocado: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True = token invalidado (logout o rotación)",
    )

    expira_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="Fecha de expiración del token",
    )

    user_agent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="User-Agent del cliente para trazabilidad",
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
        comment="IP del cliente al momento del login",
    )

    # Relaciones
    usuario: Mapped["Usuario"] = relationship(back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken jti={self.jti} revocado={self.revocado}>"