"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Modelos de usuario, rol y autenticación.

Tablas:
  cat_roles         → catálogo de roles del sistema
  usuarios          → cuentas de acceso al sistema
  usuario_roles     → relación N:M usuario ↔ rol
  usuario_permisos  → permisos granulares por usuario (ver/crear/editar/eliminar)
  refresh_tokens    → tokens de refresco activos por usuario
  perfiles          → perfil extendido del usuario
  audit_log         → registro de auditoría de cambios
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
    GESTION_HSE       = "GESTION_HSE"
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
            'GESTION_HSE',
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

    sede_asignada_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("sedes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Sede fija asignada. Si está presente, el usuario está restringido a operar solo en esta sede (ej: Vigilantes)",
    )

    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Fecha de eliminación lógica. NULL = activo",
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

    perfil: Mapped["Perfil"] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )

    permisos: Mapped["UsuarioPermiso | None"] = relationship(
        back_populates="usuario",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
        foreign_keys="[UsuarioPermiso.usuario_id]",
    )

    sede_asignada: Mapped["Sede | None"] = relationship(
        "Sede",
        foreign_keys=[sede_asignada_id],
        lazy="selectin",
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


# ── Perfil de usuario ─────────────────────────────────────────────
class Perfil(BaseModel):
    """
    Perfil extendido del usuario del sistema.

    Complementa la tabla usuarios con:
      - Información personal adicional
      - Configuración de sedes asignadas por módulo
      - Foto de perfil
      - Biografía y ubicación

    Relación 1:1 con Usuario.
    Se crea automáticamente al crear un usuario.
    """

    __tablename__ = "perfiles"

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="FK al usuario — relación 1:1",
    )

    foto_perfil: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL de la foto de perfil",
    )

    biografia: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Descripción o cargo del usuario",
    )

    ubicacion: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        comment="Ubicación o sede principal del usuario",
    )

    telefono: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono de contacto del usuario",
    )

    # Configuración de sedes asignadas por módulo
    # Se gestiona desde la tabla usuario_sedes
    # Este campo guarda la sede activa por defecto
    sede_default_id: Mapped[int | None] = mapped_column(
        ForeignKey("sedes.id", ondelete="SET NULL"),
        nullable=True,
        comment="Sede activa por defecto del usuario",
    )

    # Preferencias UI
    tema: Mapped[str] = mapped_column(
        String(20),
        default="dark",
        nullable=False,
        comment="Tema de la interfaz: dark/light",
    )

    notificaciones_email: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si recibe notificaciones por email",
    )

    # Relaciones
    usuario: Mapped["Usuario"] = relationship(back_populates="perfil")

    def __repr__(self) -> str:
        return f"<Perfil usuario={self.usuario_id}>"


# ── Permisos granulares por usuario ───────────────────────────────
class UsuarioPermiso(BaseModel):
    """
    Permisos operativos granulares por usuario.

    Complementa el sistema de roles con control fino de operaciones.
    Un usuario puede tener un rol pero con operaciones restringidas.

    Ejemplo:
      ADMIN_HSE con puede_eliminar=False → no puede eliminar registros
      GESTION_HSE con puede_crear=True   → puede crear autorizaciones

    El ADMIN_GLOBAL siempre bypasea esta tabla.
    Se crea automáticamente al crear el usuario vía Herramientas.
    """

    __tablename__ = "usuario_permisos"
    __table_args__ = (
        UniqueConstraint("usuario_id", name="uq_usuario_permisos_unico"),
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="FK al usuario — relación 1:1",
    )

    puede_ver: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Puede consultar y visualizar registros",
    )

    puede_crear: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Puede crear nuevos registros",
    )

    puede_editar: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Puede editar registros existentes",
    )

    puede_eliminar: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Puede eliminar o anular registros",
    )

    asignado_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        comment="FK al admin que configuró estos permisos",
    )

    # Relaciones
    usuario: Mapped["Usuario"] = relationship(
        back_populates="permisos",
        foreign_keys="[UsuarioPermiso.usuario_id]",
    )

    def __repr__(self) -> str:
        return (
            f"<UsuarioPermiso usuario={self.usuario_id} "
            f"ver={self.puede_ver} crear={self.puede_crear} "
            f"editar={self.puede_editar} eliminar={self.puede_eliminar}>"
        )


# ── Registro de auditoría ─────────────────────────────────────────
class AuditLog(BaseModel):
    """
    Registro inmutable de todas las acciones administrativas del sistema.

    Cada vez que un ADMIN_GLOBAL realiza una acción en Herramientas
    (crear usuario, asignar rol, cambiar permisos, etc.) se registra
    aquí con el actor, la acción y el detalle.

    Este registro NO tiene soft delete — es permanente por diseño.
    """

    __tablename__ = "audit_log"

    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="FK al usuario que realizó la acción",
    )

    actor_nombre: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Nombre del actor en el momento de la acción (desnormalizado para historial)",
    )

    accion: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Código de la acción: CREAR_USUARIO, ASIGNAR_ROL, etc.",
    )

    entidad: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Entidad afectada: Usuario, UsuarioRol, UsuarioPermiso",
    )

    entidad_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="ID de la entidad afectada",
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Descripción legible de la acción realizada",
    )

    def __repr__(self) -> str:
        return f"<AuditLog actor={self.actor_id} accion={self.accion}>"