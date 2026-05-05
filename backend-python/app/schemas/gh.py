"""
KOAJ Access v2.0 — Permoda S.A.S.
Schemas base del módulo Gestión Humana (GH).
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


GhTipoCita = Literal[
    "INDUCCION",
    "FIRMA_CONTRATO",
    "ENTREGA_DOTACION",
]

GhEstadoCita = Literal[
    "PROGRAMADA",
    "CONFIRMADA",
    "EN_CURSO",
    "FINALIZADA",
    "NO_ASISTIO",
    "CANCELADA",
]

GhEstadoSesionInduccion = Literal[
    "PROGRAMADA",
    "EN_CURSO",
    "FINALIZADA",
    "CERRADA",
    "CANCELADA",
]

GhEstadoAsistenciaInduccion = Literal[
    "PENDIENTE",
    "CHECKIN_OK",
    "EN_SESION",
    "CHECKOUT_OK",
    "NO_ASISTIO",
    "SALIDA_PENDIENTE",
]

GhEstadoEntregaDotacion = Literal[
    "PENDIENTE",
    "PARCIAL",
    "COMPLETA",
    "REPROGRAMADA",
    "ANULADA",
]

GhEstadoItemDotacion = Literal[
    "PENDIENTE",
    "ENTREGADO",
    "FALTANTE",
]


class GhCatalogoItemResponse(BaseModel):
    id: str
    nombre: str


class GhCandidatoBase(BaseModel):
    tipo_documento: str = Field(min_length=2, max_length=20)
    numero_documento: str = Field(min_length=3, max_length=30)
    nombres: str = Field(min_length=2, max_length=120)
    apellidos: str = Field(min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=30)


class GhCitaCreateRequest(BaseModel):
    candidato: GhCandidatoBase
    sede_id: int
    tipo_cita: GhTipoCita
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    observaciones: str | None = None


class GhCitaGrupoCreateRequest(BaseModel):
    candidatos: list[GhCandidatoBase] = Field(min_length=1, max_length=100)
    sede_id: int
    tipo_cita: GhTipoCita
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    observaciones: str | None = None


class GhCitaUpdateRequest(BaseModel):
    tipo_cita: GhTipoCita | None = None
    fecha_hora_inicio: datetime | None = None
    fecha_hora_fin: datetime | None = None
    observaciones: str | None = None


class GhCitaEstadoRequest(BaseModel):
    estado: GhEstadoCita
    motivo: str | None = None


class GhCandidatoResponse(GhCandidatoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class GhCitaSesionInduccionResumenResponse(BaseModel):
    sesion_id: int
    estado_sesion: GhEstadoSesionInduccion
    area: str
    tipo_induccion: str


class GhCitaResponse(BaseModel):
    id: int
    codigo: str
    sede_id: int
    tipo_cita: GhTipoCita
    estado: GhEstadoCita
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    observaciones: str | None
    candidato: GhCandidatoResponse
    sesion_induccion: GhCitaSesionInduccionResumenResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class GhPortalValidateResponse(BaseModel):
    token: str
    vigente: bool
    expira_en: datetime
    cita: GhCitaResponse


class GhPortalConfirmRequest(BaseModel):
    confirmada: bool
    comentario: str | None = None


class GhPortalReagendarRequest(BaseModel):
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    comentario: str | None = None


class GhPortalAccionResponse(BaseModel):
    token: str
    accion: Literal["CONFIRMAR", "CANCELAR", "REAGENDAR"]
    cita: GhCitaResponse


class GhVigilanteVerificarRequest(BaseModel):
    sede_id: int
    tipo_documento: str
    numero_documento: str


class GhVigilanteVerificarResponse(BaseModel):
    estado: Literal["AUTORIZADO", "NO_AUTORIZADO", "NO_REGISTRADO"]
    mensaje: str
    cita: GhCitaResponse | None = None


class GhVigilanteAccesoRequest(BaseModel):
    cita_id: int
    sede_id: int
    tipo_acceso: Literal["ENTRADA", "SALIDA"]
    metodo: str = Field(default="MANUAL", min_length=3, max_length=30)
    notas: str | None = None


class GhVigilanteAccesoResponse(BaseModel):
    id: int
    cita_id: int
    sede_id: int
    vigilante_id: int | None
    tipo_acceso: Literal["ENTRADA", "SALIDA"]
    metodo: str
    notas: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GhImportacionCreateRequest(BaseModel):
    sede_id: int
    nombre_archivo: str


class GhImportacionResponse(BaseModel):
    id: int
    sede_id: int
    nombre_archivo: str
    estado: Literal["PENDIENTE", "PROCESANDO", "COMPLETADA", "FALLIDA"]
    filas_totales: int
    filas_exitosas: int
    filas_fallidas: int
    resumen_error: str | None

    model_config = ConfigDict(from_attributes=True)


class GhImportacionDetalleResponse(BaseModel):
    id: int
    numero_fila: int
    estado: str
    mensaje: str
    payload: dict | None

    model_config = ConfigDict(from_attributes=True)


class GhImportacionDetalleListadoResponse(GhImportacionResponse):
    detalles: list[GhImportacionDetalleResponse]


class GhDashboardResponse(BaseModel):
    citas_hoy_total: int
    citas_hoy_confirmadas: int
    citas_hoy_no_asistio: int
    citas_en_curso: int


class GhInduccionAsistenteCreateRequest(BaseModel):
    tipo_documento: str = Field(min_length=2, max_length=20)
    numero_documento: str = Field(min_length=3, max_length=30)
    nombres: str = Field(min_length=2, max_length=120)
    apellidos: str = Field(min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=30)


class GhSesionInduccionCreateRequest(BaseModel):
    sede_id: int
    area: str = Field(min_length=2, max_length=120)
    tipo_induccion: str = Field(min_length=2, max_length=120)
    responsable_usuario_id: int | None = None
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    cita_ids: list[int] = Field(default_factory=list, max_length=500)
    asistentes: list[GhInduccionAsistenteCreateRequest] = Field(default_factory=list, max_length=500)


class GhSesionInduccionEstadoRequest(BaseModel):
    estado_sesion: GhEstadoSesionInduccion
    motivo: str | None = None


class GhCodigoTemporalResponse(BaseModel):
    sesion_id: int
    tipo: Literal["CHECKIN", "CHECKOUT"]
    codigo: str
    expira_en: datetime


class GhInduccionAsistenciaResponse(BaseModel):
    id: int
    candidato: GhCandidatoResponse
    estado_asistencia: GhEstadoAsistenciaInduccion
    token_autogestion: str
    checkin_at: datetime | None
    checkout_at: datetime | None
    intentos_codigo: int
    ultimo_error_codigo: str | None

    model_config = ConfigDict(from_attributes=True)


class GhSesionInduccionResponse(BaseModel):
    id: int
    sede_id: int
    area: str
    tipo_induccion: str
    responsable_usuario_id: int | None
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado_sesion: GhEstadoSesionInduccion
    codigo_checkin_actual: str | None
    codigo_checkout_actual: str | None
    fecha_cierre: datetime | None
    related_cita_ids: list[int] = Field(default_factory=list)
    asistentes: list[GhInduccionAsistenciaResponse]

    model_config = ConfigDict(from_attributes=True)


class GhPortalInduccionValidateResponse(BaseModel):
    token: str
    vigente: bool
    ventana_habilitada: bool
    expira_en: datetime
    sesion_id: int
    estado_sesion: GhEstadoSesionInduccion
    estado_asistencia: GhEstadoAsistenciaInduccion
    candidato: GhCandidatoResponse


class GhPortalInduccionCodigoRequest(BaseModel):
    codigo: str = Field(min_length=4, max_length=10)


class GhPortalInduccionAccionResponse(BaseModel):
    token: str
    accion: Literal["CHECKIN", "CHECKOUT"]
    estado_asistencia: GhEstadoAsistenciaInduccion
    timestamp: datetime


class GhMaestroDotacionCreateRequest(BaseModel):
    sede_id: int | None = None
    area: str = Field(min_length=2, max_length=120)
    cargo: str = Field(min_length=2, max_length=120)
    tipo_contrato: str = Field(min_length=2, max_length=50)
    kit_codigo: str = Field(min_length=2, max_length=50)
    kit_descripcion: str = Field(min_length=2, max_length=500)
    activo: bool = True


class GhMaestroDotacionUpdateRequest(BaseModel):
    area: str | None = Field(default=None, min_length=2, max_length=120)
    cargo: str | None = Field(default=None, min_length=2, max_length=120)
    tipo_contrato: str | None = Field(default=None, min_length=2, max_length=50)
    kit_codigo: str | None = Field(default=None, min_length=2, max_length=50)
    kit_descripcion: str | None = Field(default=None, min_length=2, max_length=500)
    activo: bool | None = None


class GhMaestroDotacionResponse(BaseModel):
    id: int
    sede_id: int | None
    area: str
    cargo: str
    tipo_contrato: str
    kit_codigo: str
    kit_descripcion: str
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class GhDotacionEntregaCreateRequest(BaseModel):
    candidato_id: int
    sesion_o_cita_id: int
    tipo_referencia: Literal["SESION", "CITA"]
    observaciones: str | None = None


class GhDotacionEntregaDetalleCreateRequest(BaseModel):
    item_codigo: str = Field(min_length=2, max_length=50)
    item_nombre: str = Field(min_length=2, max_length=200)
    cantidad_esperada: int = Field(default=1, ge=1)
    cantidad_entregada: int = Field(default=0, ge=0)
    estado_item: GhEstadoItemDotacion = "PENDIENTE"
    evidencia_url: str | None = None


class GhDotacionEntregaDetalleResponse(BaseModel):
    id: int
    item_codigo: str
    item_nombre: str
    cantidad_esperada: int
    cantidad_entregada: int
    estado_item: GhEstadoItemDotacion
    evidencia_url: str | None

    model_config = ConfigDict(from_attributes=True)


class GhDotacionEntregaResponse(BaseModel):
    id: int
    candidato_id: int
    sesion_id: int | None
    cita_id: int | None
    estado_entrega: GhEstadoEntregaDotacion
    entregado_por_usuario_id: int | None
    fecha_entrega: datetime | None
    observaciones: str | None
    detalles: list[GhDotacionEntregaDetalleResponse]

    model_config = ConfigDict(from_attributes=True)
