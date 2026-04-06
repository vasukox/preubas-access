"""
KOAJ Access v2.0 — Permoda S.A.S.
Modelos ORM del módulo HSE

Tablas (17):
  Catálogos (4):
    cat_eps, cat_arl, cat_afp, cat_normas_seguridad

  Núcleo (2):
    hse_autorizaciones, hse_contratistas

  Autogestión (6):
    hse_clasificacion_actividad, hse_seguridad_social,
    hse_certificaciones, hse_examen_medico,
    hse_contacto_emergencia, hse_aceptacion_normas

  Operación (3):
    hse_accesos, hse_cumplimiento, hse_cumplimiento_items

  Control (2):
    hse_excepciones, hse_historial_estados
"""

from datetime import date, datetime
from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey,
    Integer, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


# ═══════════════════════════════════════════════════════════════════
# CATÁLOGOS
# ═══════════════════════════════════════════════════════════════════

class CatEPS(BaseModel):
    __tablename__ = "cat_eps"

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str] = mapped_column(String(20),  nullable=False, unique=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    seguridad_social: Mapped[list["HseSegSocial"]] = relationship(
        back_populates="eps"
    )

    def __repr__(self) -> str:
        return f"<EPS {self.nombre}>"


class CatARL(BaseModel):
    __tablename__ = "cat_arl"

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str] = mapped_column(String(20),  nullable=False, unique=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    seguridad_social: Mapped[list["HseSegSocial"]] = relationship(
        back_populates="arl"
    )

    def __repr__(self) -> str:
        return f"<ARL {self.nombre}>"


class CatAFP(BaseModel):
    __tablename__ = "cat_afp"

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str] = mapped_column(String(20),  nullable=False, unique=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    seguridad_social: Mapped[list["HseSegSocial"]] = relationship(
        back_populates="afp"
    )

    def __repr__(self) -> str:
        return f"<AFP {self.nombre}>"


class CatNormaSeguridad(BaseModel):
    """
    Normas de seguridad que el contratista debe leer y aceptar
    en el paso 8 del wizard de autogestión.
    sede_id = None → aplica a todas las sedes.
    """
    __tablename__ = "cat_normas_seguridad"

    numero:   Mapped[int]       = mapped_column(Integer, nullable=False, comment="Orden de lectura")
    titulo:   Mapped[str]       = mapped_column(String(200), nullable=False)
    contenido: Mapped[str]      = mapped_column(Text, nullable=False)
    activa:   Mapped[bool]      = mapped_column(Boolean, default=True, nullable=False)
    sede_id:  Mapped[int | None] = mapped_column(
        ForeignKey("sedes.id", ondelete="SET NULL"),
        nullable=True,
        comment="NULL = aplica a todas las sedes",
    )

    def __repr__(self) -> str:
        return f"<NormaSeguridad {self.numero}. {self.titulo}>"


# ═══════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════

TIPO_CONTRATISTA_ENUM = Enum(
    "ALTO_RIESGO", "NORMAL",
    name="hse_tipo_contratista_enum",
)

ESTADO_AUTORIZACION_ENUM = Enum(
    "BORRADOR",
    "PENDIENTE_AUTOGESTION",
    "EN_REVISION",
    "APROBADO",
    "DENEGADO",
    "VENCIDO",
    name="hse_estado_autorizacion_enum",
)

ESTADO_CONTRATISTA_ENUM = Enum(
    "PENDIENTE_AUTOGESTION",
    "AUTOGESTION_EN_PROGRESO",
    "AUTOGESTION_COMPLETADA",
    "EN_REVISION",
    "APROBADO",
    "DENEGADO",
    name="hse_estado_contratista_enum",
)

TIPO_DOCUMENTO_ENUM = Enum(
    "CC", "CE", "PASAPORTE", "TI",
    name="hse_tipo_documento_enum",
)

ALTURAS_NIVEL_ENUM = Enum(
    "BASICO", "AVANZADO", "COORDINADOR",
    name="hse_alturas_nivel_enum",
)

CONFINADOS_ROL_ENUM = Enum(
    "SUPERVISOR", "VIGIA", "ENTRANTE",
    name="hse_confinados_rol_enum",
)

ELECTRICO_MATRICULA_ENUM = Enum(
    "TE1", "TE2", "TE3", "TE4", "TE5", "TE6",
    name="hse_electrico_matricula_enum",
)

PILA_TIPO_ENUM = Enum(
    "INTEGRADA", "MANUAL", "NO_APLICA",
    name="hse_pila_tipo_enum",
)

PILA_ESTADO_ENUM = Enum(
    "PENDIENTE", "PAGADA", "VENCIDA",
    name="hse_pila_estado_enum",
)

PERMISO_TIPO_ENUM = Enum(
    "ALTURAS", "CONFINADOS", "CALIENTE", "ELECTRICO", "GENERAL",
    name="hse_permiso_tipo_enum",
)

CONCEPTO_MEDICO_ENUM = Enum(
    "APTO", "APTO_CON_RESTRICCION", "NO_APTO", "PENDIENTE",
    name="hse_concepto_medico_enum",
)

RELACION_EMERGENCIA_ENUM = Enum(
    "FAMILIAR", "CONYUGE", "COLEGA", "OTRO",
    name="hse_relacion_emergencia_enum",
)

RH_ENUM = Enum(
    "A_POS", "A_NEG", "B_POS", "B_NEG",
    "AB_POS", "AB_NEG", "O_POS", "O_NEG",
    name="hse_rh_enum",
)

METODO_ACCESO_ENUM = Enum(
    "CEDULA_MANUAL", "LECTOR_USB", "MANUAL_VIGILANTE",
    name="hse_metodo_acceso_enum",
)

TIPO_ACCESO_ENUM = Enum(
    "ENTRADA", "SALIDA",
    name="hse_tipo_acceso_enum",
)

CUMPLIMIENTO_ESTADO_ENUM = Enum(
    "EN_PROGRESO", "COMPLETADO", "INCUMPLIMIENTO",
    name="hse_cumplimiento_estado_enum",
)


# ═══════════════════════════════════════════════════════════════════
# NÚCLEO — Autorización
# ═══════════════════════════════════════════════════════════════════

class HseAutorizacion(BaseModel):
    """
    Cabecera de la autorización HSE.
    El admin la crea en el Panel General.
    Una autorización puede tener N contratistas.
    """
    __tablename__ = "hse_autorizaciones"

    # Identificación
    codigo: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True, index=True,
        comment="HSE-2026-XXXX — generado automáticamente",
    )

    # Relaciones externas
    proveedor_id: Mapped[int | None] = mapped_column(
        ForeignKey("proveedores.id", ondelete="SET NULL"),
        nullable=True,
        comment="FK al proveedor de los contratistas",
    )
    sede_id: Mapped[int] = mapped_column(
        ForeignKey("sedes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    creado_por: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="RESTRICT"),
        nullable=False,
    )
    responsable_interno_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Datos de la autorización
    tipo_contratista: Mapped[str] = mapped_column(
        TIPO_CONTRATISTA_ENUM, nullable=False,
    )
    descripcion_actividad: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin:    Mapped[date] = mapped_column(Date, nullable=False)

    # Estado
    estado: Mapped[str] = mapped_column(
        ESTADO_AUTORIZACION_ENUM,
        nullable=False,
        default="BORRADOR",
    )
    motivo_denegacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relaciones ORM
    contratistas: Mapped[list["HseContratista"]] = relationship(
        back_populates="autorizacion",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<HseAutorizacion {self.codigo}>"


# ═══════════════════════════════════════════════════════════════════
# NÚCLEO — Contratista
# ═══════════════════════════════════════════════════════════════════

class HseContratista(BaseModel):
    """
    Representa a una persona individual dentro de una autorización.
    Cada contratista tiene su propio link de autogestión.
    """
    __tablename__ = "hse_contratistas"

    autorizacion_id: Mapped[int] = mapped_column(
        ForeignKey("hse_autorizaciones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    persona_id: Mapped[int | None] = mapped_column(
        ForeignKey("personas.id", ondelete="SET NULL"),
        nullable=True,
        comment="Se vincula cuando la persona ya existe en BD",
    )

    # Datos pre-llenados por el admin
    tipo_documento:   Mapped[str]       = mapped_column(TIPO_DOCUMENTO_ENUM, nullable=False)
    numero_documento: Mapped[str]       = mapped_column(String(30), nullable=False, index=True)
    nombres:          Mapped[str]       = mapped_column(String(100), nullable=False)
    apellidos:        Mapped[str]       = mapped_column(String(100), nullable=False)
    email:            Mapped[str]       = mapped_column(String(150), nullable=False)
    telefono:         Mapped[str | None] = mapped_column(String(20), nullable=True)
    es_extranjero:    Mapped[bool]      = mapped_column(Boolean, default=False, nullable=False)

    # Estado individual
    estado: Mapped[str] = mapped_column(
        ESTADO_CONTRATISTA_ENUM,
        nullable=False,
        default="PENDIENTE_AUTOGESTION",
    )
    motivo_denegacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Token de autogestión
    token_autogestion:       Mapped[str | None]      = mapped_column(String(64), unique=True, nullable=True, index=True)
    token_expira_en:         Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token_duracion_horas:    Mapped[int | None]      = mapped_column(Integer, nullable=True, comment="24, 48, 72 o personalizado")
    autogestion_completada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Responsable SST
    sst_responsable_nombre:   Mapped[str | None] = mapped_column(String(150), nullable=True)
    sst_responsable_telefono: Mapped[str | None] = mapped_column(String(20),  nullable=True)

    # Relaciones ORM
    autorizacion:        Mapped["HseAutorizacion"]       = relationship(back_populates="contratistas")
    clasificacion:       Mapped["HseClasificacion | None"] = relationship(back_populates="contratista", uselist=False, cascade="all, delete-orphan")
    seguridad_social:    Mapped[list["HseSegSocial"]]    = relationship(back_populates="contratista", cascade="all, delete-orphan")
    certificaciones:     Mapped["HseCertificaciones | None"] = relationship(back_populates="contratista", uselist=False, cascade="all, delete-orphan")
    examen_medico:       Mapped["HseExamenMedico | None"]    = relationship(back_populates="contratista", uselist=False, cascade="all, delete-orphan")
    contacto_emergencia: Mapped["HseContactoEmergencia | None"] = relationship(back_populates="contratista", uselist=False, cascade="all, delete-orphan")
    aceptacion_normas:   Mapped["HseAceptacionNormas | None"]   = relationship(back_populates="contratista", uselist=False, cascade="all, delete-orphan")
    accesos:             Mapped[list["HseAcceso"]]       = relationship(back_populates="contratista", cascade="all, delete-orphan")
    cumplimientos:       Mapped[list["HseCumplimiento"]] = relationship(back_populates="contratista", cascade="all, delete-orphan")
    historial:           Mapped[list["HseHistorial"]]    = relationship(back_populates="contratista", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        numero_documento = self.__dict__.get("numero_documento", "?")
        apellidos = self.__dict__.get("apellidos", "?")
        return f"<HseContratista {numero_documento} - {apellidos}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Clasificación de actividad (8 preguntas)
# ═══════════════════════════════════════════════════════════════════

class HseClasificacion(BaseModel):
    """
    Respuestas a las 8 preguntas de clasificación de actividad.
    Determina si el contratista es ALTO_RIESGO o NORMAL.
    """
    __tablename__ = "hse_clasificacion_actividad"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    # 8 preguntas SI/NO
    trabajo_alturas:    Mapped[bool] = mapped_column(Boolean, default=False)
    espacios_confinados: Mapped[bool] = mapped_column(Boolean, default=False)
    trabajo_electrico:  Mapped[bool] = mapped_column(Boolean, default=False)
    trabajo_caliente:   Mapped[bool] = mapped_column(Boolean, default=False)
    izaje_maquinaria:   Mapped[bool] = mapped_column(Boolean, default=False)
    visita_sin_riesgo:  Mapped[bool] = mapped_column(Boolean, default=False)
    personal_extranjero: Mapped[bool] = mapped_column(Boolean, default=False)
    genera_residuos:    Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Alturas ───────────────────────────────────────────────────
    alturas_nivel:          Mapped[str | None]      = mapped_column(ALTURAS_NIVEL_ENUM, nullable=True)
    alturas_cert_fecha_venc: Mapped[date | None]    = mapped_column(Date, nullable=True)
    alturas_cert_archivo:   Mapped[str | None]      = mapped_column(String(500), nullable=True)

    # ── Espacios confinados ───────────────────────────────────────
    confinados_rol:          Mapped[str | None]  = mapped_column(CONFINADOS_ROL_ENUM, nullable=True)
    confinados_cert_fecha:   Mapped[date | None] = mapped_column(Date, nullable=True)
    confinados_cert_archivo: Mapped[str | None]  = mapped_column(String(500), nullable=True)

    # ── Trabajo eléctrico ─────────────────────────────────────────
    electrico_matricula_contec:  Mapped[str | None]  = mapped_column(ELECTRICO_MATRICULA_ENUM, nullable=True)
    electrico_num_matricula:     Mapped[str | None]  = mapped_column(String(50), nullable=True)
    electrico_matricula_venc:    Mapped[date | None] = mapped_column(Date, nullable=True)
    electrico_matricula_archivo: Mapped[str | None]  = mapped_column(String(500), nullable=True)

    # ── Trabajo en caliente ───────────────────────────────────────
    caliente_extintor_fecha:   Mapped[date | None] = mapped_column(Date, nullable=True)
    caliente_extintor_archivo: Mapped[str | None]  = mapped_column(String(500), nullable=True)
    caliente_permiso_fecha:    Mapped[date | None] = mapped_column(Date, nullable=True)
    caliente_permiso_archivo:  Mapped[str | None]  = mapped_column(String(500), nullable=True)

    # ── Izaje ─────────────────────────────────────────────────────
    izaje_tipo_equipo:         Mapped[str | None] = mapped_column(String(100), nullable=True)
    izaje_inspeccion_archivo:  Mapped[str | None] = mapped_column(String(500), nullable=True)
    izaje_doc_legal_archivo:   Mapped[str | None] = mapped_column(String(500), nullable=True)
    izaje_licencia_archivo:    Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Extranjero ────────────────────────────────────────────────
    extran_aseguradora:    Mapped[str | None]  = mapped_column(String(150), nullable=True)
    extran_num_poliza:     Mapped[str | None]  = mapped_column(String(100), nullable=True)
    extran_poliza_venc:    Mapped[date | None] = mapped_column(Date, nullable=True)
    extran_poliza_archivo: Mapped[str | None]  = mapped_column(String(500), nullable=True)

    # ── Residuos ──────────────────────────────────────────────────
    residuos_tipo:         Mapped[str | None] = mapped_column(String(200), nullable=True)
    residuos_plan_archivo: Mapped[str | None] = mapped_column(String(500), nullable=True)

    contratista: Mapped["HseContratista"] = relationship(back_populates="clasificacion")

    def __repr__(self) -> str:
        return f"<HseClasificacion contratista={self.contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Seguridad social
# ═══════════════════════════════════════════════════════════════════

class HseSegSocial(BaseModel):
    """
    Seguridad social del contratista o miembros de su cuadrilla.
    es_titular=True → el contratista principal.
    es_titular=False → miembro de cuadrilla.
    """
    __tablename__ = "hse_seguridad_social"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    es_titular:     Mapped[bool]       = mapped_column(Boolean, default=True, nullable=False)
    nombre_persona: Mapped[str | None] = mapped_column(String(150), nullable=True, comment="Si no es el titular")
    cedula_persona: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # EPS
    eps_id:      Mapped[int | None]  = mapped_column(ForeignKey("cat_eps.id", ondelete="SET NULL"), nullable=True)
    eps_vigencia: Mapped[date | None] = mapped_column(Date, nullable=True)

    # ARL
    arl_id:      Mapped[int | None]  = mapped_column(ForeignKey("cat_arl.id", ondelete="SET NULL"), nullable=True)
    arl_vigencia: Mapped[date | None] = mapped_column(Date, nullable=True)

    # AFP
    afp_id:      Mapped[int | None]  = mapped_column(ForeignKey("cat_afp.id", ondelete="SET NULL"), nullable=True)
    afp_vigencia: Mapped[date | None] = mapped_column(Date, nullable=True)

    # PILA
    pila_tipo:    Mapped[str | None] = mapped_column(PILA_TIPO_ENUM, nullable=True)
    pila_estado:  Mapped[str | None] = mapped_column(PILA_ESTADO_ENUM, nullable=True)
    pila_archivo: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # SST
    sst_tiene_vigente:       Mapped[bool]      = mapped_column(Boolean, default=False)
    sst_responsable_nombre:  Mapped[str | None] = mapped_column(String(150), nullable=True)
    sst_resolucion_registro: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relaciones
    contratista: Mapped["HseContratista"] = relationship(back_populates="seguridad_social")
    eps:         Mapped["CatEPS | None"]  = relationship(back_populates="seguridad_social")
    arl:         Mapped["CatARL | None"]  = relationship(back_populates="seguridad_social")
    afp:         Mapped["CatAFP | None"]  = relationship(back_populates="seguridad_social")

    def __repr__(self) -> str:
        return f"<HseSegSocial contratista={self.contratista_id} titular={self.es_titular}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Certificaciones
# ═══════════════════════════════════════════════════════════════════

class HseCertificaciones(BaseModel):
    """ART y permiso de trabajo del contratista."""
    __tablename__ = "hse_certificaciones"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    # ART
    art_descripcion_tarea: Mapped[str | None] = mapped_column(Text, nullable=True)
    art_archivo:           Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Permiso de trabajo
    permiso_tipo:    Mapped[str | None]  = mapped_column(PERMISO_TIPO_ENUM, nullable=True)
    permiso_fecha:   Mapped[date | None] = mapped_column(Date, nullable=True)
    permiso_archivo: Mapped[str | None]  = mapped_column(String(500), nullable=True)

    contratista: Mapped["HseContratista"] = relationship(back_populates="certificaciones")

    def __repr__(self) -> str:
        return f"<HseCertificaciones contratista={self.contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Examen médico
# ═══════════════════════════════════════════════════════════════════

class HseExamenMedico(BaseModel):
    """Solo requerido para contratistas ALTO_RIESGO."""
    __tablename__ = "hse_examen_medico"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    fecha_examen:             Mapped[date | None] = mapped_column(Date, nullable=True)
    concepto:                 Mapped[str | None]  = mapped_column(CONCEPTO_MEDICO_ENUM, nullable=True)
    descripcion_restriccion:  Mapped[str | None]  = mapped_column(Text, nullable=True)
    archivo:                  Mapped[str | None]  = mapped_column(String(500), nullable=True)

    contratista: Mapped["HseContratista"] = relationship(back_populates="examen_medico")

    def __repr__(self) -> str:
        return f"<HseExamenMedico contratista={self.contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Contacto de emergencia (enriquecido)
# ═══════════════════════════════════════════════════════════════════

class HseContactoEmergencia(BaseModel):
    __tablename__ = "hse_contacto_emergencia"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    nombre_completo:  Mapped[str]       = mapped_column(String(150), nullable=False)
    relacion:         Mapped[str]       = mapped_column(RELACION_EMERGENCIA_ENUM, nullable=False)
    relacion_otro:    Mapped[str | None] = mapped_column(String(80), nullable=True)
    telefono_celular: Mapped[str]       = mapped_column(String(20), nullable=False)
    telefono_fijo:    Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Datos médicos enriquecidos
    rh_sanguineo:    Mapped[str | None] = mapped_column(RH_ENUM, nullable=True)
    alergias:        Mapped[str | None] = mapped_column(Text, nullable=True)
    condicion_medica: Mapped[str | None] = mapped_column(Text, nullable=True)
    eps_contratista: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="EPS para emergencias")

    contratista: Mapped["HseContratista"] = relationship(back_populates="contacto_emergencia")

    def __repr__(self) -> str:
        return f"<HseContactoEmergencia contratista={self.contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Aceptación de normas
# ═══════════════════════════════════════════════════════════════════

class HseAceptacionNormas(BaseModel):
    __tablename__ = "hse_aceptacion_normas"

    contratista_id: Mapped[int] = mapped_column(
        ForeignKey("hse_contratistas.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )

    acepto_normas:      Mapped[bool]            = mapped_column(Boolean, default=False)
    acepto_datos:       Mapped[bool]            = mapped_column(Boolean, default=False)
    firma_digital:      Mapped[str]             = mapped_column(String(200), nullable=False, comment="Nombre completo escrito como firma")
    fecha_aceptacion:   Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address:         Mapped[str | None]      = mapped_column(String(45), nullable=True)

    contratista: Mapped["HseContratista"] = relationship(back_populates="aceptacion_normas")

    def __repr__(self) -> str:
        # Evita lazy-load en contextos de logging/errores cuando el objeto
        # está expirado o la sesión no permite IO síncrono.
        contratista_id = self.__dict__.get("contratista_id", "?")
        return f"<HseAceptacionNormas contratista={contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# OPERACIÓN — Accesos (portería)
# ═══════════════════════════════════════════════════════════════════

class HseAcceso(BaseModel):
    """
    Registro de entrada/salida de un contratista.
    Lo registra el VIGILANTE_HSE al escanear la cédula.
    """
    __tablename__ = "hse_accesos"

    contratista_id:  Mapped[int]       = mapped_column(ForeignKey("hse_contratistas.id", ondelete="CASCADE"), nullable=False, index=True)
    sede_id:         Mapped[int]       = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    registrado_por:  Mapped[int]       = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    tipo:            Mapped[str]       = mapped_column(TIPO_ACCESO_ENUM, nullable=False)
    metodo:          Mapped[str]       = mapped_column(METODO_ACCESO_ENUM, nullable=False, default="CEDULA_MANUAL")
    ubicacion_id:    Mapped[int | None] = mapped_column(ForeignKey("ubicaciones.id", ondelete="SET NULL"), nullable=True)
    observacion:     Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_hora:      Mapped[datetime]  = mapped_column(DateTime(timezone=True), nullable=False)

    contratista: Mapped["HseContratista"] = relationship(back_populates="accesos")

    def __repr__(self) -> str:
        return f"<HseAcceso {self.tipo} contratista={self.contratista_id}>"


# ═══════════════════════════════════════════════════════════════════
# OPERACIÓN — Verificación de cumplimiento
# ═══════════════════════════════════════════════════════════════════

class HseCumplimiento(BaseModel):
    """
    Registro de cumplimiento de la jornada/tarea.
    El encargado (asignado por ADMIN_HSE) lo diligencia
    a lo largo del día.
    """
    __tablename__ = "hse_cumplimiento"

    contratista_id: Mapped[int] = mapped_column(ForeignKey("hse_contratistas.id", ondelete="CASCADE"), nullable=False, index=True)
    sede_id:        Mapped[int] = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    encargado_id:   Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False, comment="Asignado por ADMIN_HSE")

    estado:             Mapped[str]            = mapped_column(CUMPLIMIENTO_ESTADO_ENUM, nullable=False, default="EN_PROGRESO")
    observacion_general: Mapped[str | None]    = mapped_column(Text, nullable=True)
    fecha_inicio:       Mapped[datetime]       = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_cierre:       Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    firma_digital:      Mapped[str | None]     = mapped_column(String(200), nullable=True)

    contratista: Mapped["HseContratista"]      = relationship(back_populates="cumplimientos")
    items:       Mapped[list["HseCumplimientoItem"]] = relationship(back_populates="cumplimiento", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<HseCumplimiento contratista={self.contratista_id} estado={self.estado}>"


class HseCumplimientoItem(BaseModel):
    """Item individual del checklist de cumplimiento."""
    __tablename__ = "hse_cumplimiento_items"

    cumplimiento_id: Mapped[int] = mapped_column(
        ForeignKey("hse_cumplimiento.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    pregunta:    Mapped[str]        = mapped_column(String(300), nullable=False)
    aplica:      Mapped[bool]       = mapped_column(Boolean, default=True)
    cumple:      Mapped[bool | None] = mapped_column(Boolean, nullable=True, comment="None = no respondido aún")
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    orden:       Mapped[int]        = mapped_column(Integer, nullable=False)

    cumplimiento: Mapped["HseCumplimiento"] = relationship(back_populates="items")

    def __repr__(self) -> str:
        return f"<HseCumplimientoItem orden={self.orden} cumple={self.cumple}>"


# ═══════════════════════════════════════════════════════════════════
# CONTROL — Excepciones
# ═══════════════════════════════════════════════════════════════════

class HseExcepcion(BaseModel):
    """
    Personas pre-aprobadas sin protocolo HSE completo.
    Registradas manualmente por el ADMIN_HSE.
    """
    __tablename__ = "hse_excepciones"

    persona_id:   Mapped[int]       = mapped_column(ForeignKey("personas.id", ondelete="CASCADE"), nullable=False, index=True)
    sede_id:      Mapped[int]       = mapped_column(ForeignKey("sedes.id", ondelete="RESTRICT"), nullable=False)
    aprobado_por: Mapped[int]       = mapped_column(ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    motivo:       Mapped[str]       = mapped_column(Text, nullable=False)
    ubicacion_id: Mapped[int | None] = mapped_column(ForeignKey("ubicaciones.id", ondelete="SET NULL"), nullable=True)
    fecha_inicio: Mapped[date]      = mapped_column(Date, nullable=False)
    fecha_fin:    Mapped[date]      = mapped_column(Date, nullable=False)
    activa:       Mapped[bool]      = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<HseExcepcion persona={self.persona_id}>"


# ═══════════════════════════════════════════════════════════════════
# CONTROL — Historial de estados
# ═══════════════════════════════════════════════════════════════════

class HseHistorial(BaseModel):
    """
    Trazabilidad completa de cambios de estado de un contratista.
    Inmutable — no tiene updated_at ni deleted_at.
    """
    __tablename__ = "hse_historial_estados"

    contratista_id:  Mapped[int]       = mapped_column(ForeignKey("hse_contratistas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id:      Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, comment="Admin user; NULL = acción automática del sistema/contratista")
    estado_anterior: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estado_nuevo:    Mapped[str]       = mapped_column(String(50), nullable=False)
    motivo:          Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_extra:  Mapped[dict | None] = mapped_column(JSON, nullable=True)

    contratista: Mapped["HseContratista"] = relationship(back_populates="historial")

    def __repr__(self) -> str:
        estado_anterior = self.__dict__.get("estado_anterior", "?")
        estado_nuevo = self.__dict__.get("estado_nuevo", "?")
        return f"<HseHistorial {estado_anterior} -> {estado_nuevo}>"