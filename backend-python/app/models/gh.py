"""
KOAJ Access v2.0 — Permoda S.A.S.
Modelos ORM base del módulo Gestión Humana (GH).

Este archivo define el esqueleto inicial de tablas GH para:
- Agenda de citas
- Portal público con token
- Verificación de acceso en portería
- Importaciones por lote
- Auditoría específica del módulo
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, and_
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


GH_TIPO_CITA_ENUM = Enum(
    "INDUCCION",
    "FIRMA_CONTRATO",
    "ENTREGA_DOTACION",
    "ENTREVISTA",
    name="gh_tipo_cita_enum",
)

GH_ESTADO_CITA_ENUM = Enum(
    "PROGRAMADA",
    "CONFIRMADA",
    "EN_CURSO",
    "FINALIZADA",
    "NO_ASISTIO",
    "CANCELADA",
    name="gh_estado_cita_enum",
)

GH_IMPORTACION_ESTADO_ENUM = Enum(
    "PENDIENTE",
    "PROCESANDO",
    "COMPLETADA",
    "FALLIDA",
    name="gh_importacion_estado_enum",
)

GH_TIPO_ACCESO_ENUM = Enum(
    "ENTRADA",
    "SALIDA",
    name="gh_tipo_acceso_enum",
)

GH_ESTADO_SESION_INDUCCION_ENUM = Enum(
    "PROGRAMADA",
    "EN_CURSO",
    "FINALIZADA",
    "CERRADA",
    "CANCELADA",
    name="gh_estado_sesion_induccion_enum",
)

GH_ESTADO_ASISTENCIA_INDUCCION_ENUM = Enum(
    "PENDIENTE",
    "CHECKIN_OK",
    "EN_SESION",
    "CHECKOUT_OK",
    "NO_ASISTIO",
    "SALIDA_PENDIENTE",
    name="gh_estado_asistencia_induccion_enum",
)

GH_DOTACION_ENTREGA_ESTADO_ENUM = Enum(
    "PENDIENTE",
    "PARCIAL",
    "COMPLETA",
    "REPROGRAMADA",
    "ANULADA",
    name="gh_dotacion_entrega_estado_enum",
)

GH_DOTACION_ITEM_ESTADO_ENUM = Enum(
    "PENDIENTE",
    "ENTREGADO",
    "FALTANTE",
    name="gh_dotacion_item_estado_enum",
)


class GhCandidato(BaseModel):
    __tablename__ = "gh_candidatos"

    tipo_documento: Mapped[str] = mapped_column(String(20), nullable=False)
    numero_documento: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    nombres: Mapped[str] = mapped_column(String(120), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)

    citas: Mapped[list["GhCita"]] = relationship(back_populates="candidato")
    asistencias_induccion: Mapped[list["GhInduccionAsistencia"]] = relationship(back_populates="candidato")
    dotacion_entregas: Mapped[list["GhDotacionEntrega"]] = relationship(back_populates="candidato")
    dotacion_entregas: Mapped[list["GhDotacionEntrega"]] = relationship(back_populates="candidato")


class GhCita(BaseModel):
    __tablename__ = "gh_citas"

    codigo: Mapped[str] = mapped_column(String(25), nullable=False, unique=True, index=True)
    candidato_id: Mapped[int] = mapped_column(ForeignKey("gh_candidatos.id", ondelete="RESTRICT"), nullable=False)
    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False, index=True)
    responsable_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)

    tipo_cita: Mapped[str] = mapped_column(GH_TIPO_CITA_ENUM, nullable=False)
    estado: Mapped[str] = mapped_column(GH_ESTADO_CITA_ENUM, nullable=False, default="PROGRAMADA")
    fecha_hora_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_hora_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    candidato: Mapped["GhCandidato"] = relationship(back_populates="citas")
    tokens_portal: Mapped[list["GhPortalToken"]] = relationship(back_populates="cita")


class GhPortalToken(BaseModel):
    __tablename__ = "gh_portal_tokens"

    cita_id: Mapped[int] = mapped_column(ForeignKey("gh_citas.id", ondelete="CASCADE"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    expira_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    cita: Mapped["GhCita"] = relationship(back_populates="tokens_portal")


class GhAccesoVigilancia(BaseModel):
    __tablename__ = "gh_accesos_vigilancia"

    cita_id: Mapped[int] = mapped_column(ForeignKey("gh_citas.id", ondelete="RESTRICT"), nullable=False, index=True)
    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    vigilante_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    tipo_acceso: Mapped[str] = mapped_column(GH_TIPO_ACCESO_ENUM, nullable=False)
    metodo: Mapped[str] = mapped_column(String(30), nullable=False, default="MANUAL")
    notas: Mapped[str | None] = mapped_column(Text, nullable=True)


class GhImportacion(BaseModel):
    __tablename__ = "gh_importaciones"

    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    creado_por: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[str] = mapped_column(GH_IMPORTACION_ESTADO_ENUM, nullable=False, default="PENDIENTE")
    filas_totales: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    filas_exitosas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    filas_fallidas: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    resumen_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    detalles: Mapped[list["GhImportacionDetalle"]] = relationship(
        back_populates="importacion",
        cascade="all, delete-orphan",
    )


class GhImportacionDetalle(BaseModel):
    __tablename__ = "gh_importaciones_detalle"

    importacion_id: Mapped[int] = mapped_column(
        ForeignKey("gh_importaciones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    numero_fila: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="ERROR")
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    importacion: Mapped["GhImportacion"] = relationship(back_populates="detalles")


class GhAuditoria(BaseModel):
    __tablename__ = "gh_auditoria"

    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id", ondelete="SET NULL"), nullable=True)
    accion: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    entidad: Mapped[str] = mapped_column(String(60), nullable=False)
    entidad_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detalle: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class GhSesionInduccion(BaseModel):
    __tablename__ = "gh_sesiones_induccion"

    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String(120), nullable=False)
    tipo_induccion: Mapped[str] = mapped_column(String(120), nullable=False)
    responsable_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha_hora_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_hora_fin: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estado_sesion: Mapped[str] = mapped_column(GH_ESTADO_SESION_INDUCCION_ENUM, nullable=False, default="PROGRAMADA")
    codigo_checkin_actual: Mapped[str | None] = mapped_column(String(10), nullable=True)
    codigo_checkout_actual: Mapped[str | None] = mapped_column(String(10), nullable=True)
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    asistentes: Mapped[list["GhInduccionAsistencia"]] = relationship(
        back_populates="sesion",
        cascade="all, delete-orphan",
    )


class GhInduccionAsistencia(BaseModel):
    __tablename__ = "gh_induccion_asistencias"

    sesion_id: Mapped[int] = mapped_column(
        ForeignKey("gh_sesiones_induccion.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("gh_candidatos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    token_autogestion: Mapped[str] = mapped_column(String(96), nullable=False, unique=True, index=True)
    estado_asistencia: Mapped[str] = mapped_column(
        GH_ESTADO_ASISTENCIA_INDUCCION_ENUM,
        nullable=False,
        default="PENDIENTE",
    )
    checkin_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    checkout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    intentos_codigo: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ultimo_error_codigo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ip_entrada: Mapped[str | None] = mapped_column(String(80), nullable=True)
    user_agent_entrada: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_salida: Mapped[str | None] = mapped_column(String(80), nullable=True)
    user_agent_salida: Mapped[str | None] = mapped_column(Text, nullable=True)

    sesion: Mapped["GhSesionInduccion"] = relationship(back_populates="asistentes")
    candidato: Mapped["GhCandidato"] = relationship(back_populates="asistencias_induccion")


class GhMaestroDotacion(BaseModel):
    __tablename__ = "gh_maestro_dotacion"

    sede_id: Mapped[int | None] = mapped_column(ForeignKey("sedes.id", ondelete="SET NULL"), nullable=True, index=True)
    area: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    cargo: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    tipo_contrato: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    kit_codigo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    kit_descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class GhDotacionEntrega(BaseModel):
    __tablename__ = "gh_dotacion_entregas"

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("gh_candidatos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    sesion_o_cita_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    tipo_referencia: Mapped[str] = mapped_column(String(20), nullable=False)  # 'SESION' o 'CITA'
    estado_entrega: Mapped[str] = mapped_column(
        GH_DOTACION_ENTREGA_ESTADO_ENUM,
        nullable=False,
        default="PENDIENTE",
    )
    entregado_por_usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    candidato: Mapped["GhCandidato"] = relationship(back_populates="dotacion_entregas")
    detalles: Mapped[list["GhDotacionEntregaDetalle"]] = relationship(
        back_populates="entrega",
        cascade="all, delete-orphan",
    )
    sesion: Mapped["GhSesionInduccion | None"] = relationship(
        primaryjoin=lambda: and_(
            GhDotacionEntrega.sesion_o_cita_id == GhSesionInduccion.id,
            GhDotacionEntrega.tipo_referencia == "SESION",
        ),
        foreign_keys=lambda: [GhDotacionEntrega.sesion_o_cita_id],
        viewonly=True,
        lazy="select",
    )


class GhDotacionEntregaDetalle(BaseModel):
    __tablename__ = "gh_dotacion_entregas_detalle"

    entrega_id: Mapped[int] = mapped_column(
        ForeignKey("gh_dotacion_entregas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_codigo: Mapped[str] = mapped_column(String(50), nullable=False)
    item_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    cantidad_esperada: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    cantidad_entregada: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estado_item: Mapped[str] = mapped_column(
        GH_DOTACION_ITEM_ESTADO_ENUM,
        nullable=False,
        default="PENDIENTE",
    )
    evidencia_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    entrega: Mapped["GhDotacionEntrega"] = relationship(back_populates="detalles")
