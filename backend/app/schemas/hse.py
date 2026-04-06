"""
KOAJ Access v2.0 — Permoda S.A.S.
Schemas Pydantic del módulo HSE

Cubre todos los request/response del módulo:
  - Catálogos (EPS, ARL, AFP, Normas)
  - Autorizaciones
  - Contratistas
  - Autogestión (wizard completo)
  - Accesos (portería)
  - Cumplimiento
  - Excepciones
  - Historial
"""

from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════════════════════════════
# CATÁLOGOS
# ═══════════════════════════════════════════════════════════════════

class CatItemResponse(BaseModel):
    """Respuesta genérica para catálogos EPS, ARL, AFP."""
    id:     int
    nombre: str
    codigo: str
    activa: bool

    model_config = {"from_attributes": True}


class ProveedorHSEOptionResponse(BaseModel):
    id:     int
    nombre: str
    activo: bool

    model_config = {"from_attributes": True}


class ProveedorHSECreateRequest(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=200)
    nit:    str = Field(..., min_length=5, max_length=20)


class ProveedorHSEUpdateRequest(BaseModel):
    nombre: str  = Field(..., min_length=3, max_length=200)
    nit:    str  = Field(..., min_length=5, max_length=20)
    activo: bool = True


class NormaResponse(BaseModel):
    id:        int
    numero:    int
    titulo:    str
    contenido: str
    activa:    bool
    sede_id:   int | None

    model_config = {"from_attributes": True}


class SedeBasicaResponse(BaseModel):
    id:     int
    nombre: str
    ciudad: str

    model_config = {"from_attributes": True}


class UploadArchivoResponse(BaseModel):
    """Respuesta estándar para uploads PDF en autogestión HSE."""
    modulo:       str
    campo:        str
    path:         str
    filename:     str
    content_type: str
    size_bytes:   int


# ═══════════════════════════════════════════════════════════════════
# AUTORIZACIONES
# ═══════════════════════════════════════════════════════════════════

class AutorizacionCreateRequest(BaseModel):
    """
    Datos que el ADMIN_HSE llena al crear una autorización.
    No necesita toda la info — solo lo que el admin conoce.
    """
    proveedor_id:          int | None = None
    sede_id:               int
    responsable_interno_id: int | None = None
    tipo_contratista:      str = Field(..., pattern="^(ALTO_RIESGO|NORMAL)$")
    descripcion_actividad: str = Field(..., min_length=10)
    fecha_inicio:          date
    fecha_fin:             date
    contratistas:          list["ContratistaPreliminarRequest"]


class AutorizacionUpdateRequest(BaseModel):
    proveedor_id:          int | None = None
    responsable_interno_id: int | None = None
    tipo_contratista:      str | None = None
    descripcion_actividad: str | None = None
    fecha_inicio:          date | None = None
    fecha_fin:             date | None = None


class AutorizacionDenegarRequest(BaseModel):
    motivo: str = Field(..., min_length=10)


class AutorizacionResponse(BaseModel):
    id:                    int
    codigo:                str
    proveedor_id:          int | None
    sede_id:               int
    creado_por:            int
    responsable_interno_id: int | None
    tipo_contratista:      str
    descripcion_actividad: str
    fecha_inicio:          date
    fecha_fin:             date
    estado:                str
    motivo_denegacion:     str | None
    created_at:            datetime
    updated_at:            datetime
    contratistas:          list["ContratistaResumenResponse"]

    model_config = {"from_attributes": True}


class AutorizacionListResponse(BaseModel):
    """Versión resumida para listados."""
    id:                    int
    codigo:                str
    tipo_contratista:      str
    estado:                str
    fecha_inicio:          date
    fecha_fin:             date
    sede_id:               int
    proveedor_id:          int | None = None
    descripcion_actividad: str | None = None
    total_contratistas:    int = 0
    aprobados:             int = 0
    pendientes:            int = 0
    contratistas:          list["ContratistaResumenResponse"] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_counts(cls, auth: Any) -> "AutorizacionListResponse":
        contratistas = auth.contratistas or []
        return cls(
            id                    = auth.id,
            codigo                = auth.codigo,
            tipo_contratista      = auth.tipo_contratista,
            estado                = auth.estado,
            fecha_inicio          = auth.fecha_inicio,
            fecha_fin             = auth.fecha_fin,
            sede_id               = auth.sede_id,
            proveedor_id          = auth.proveedor_id,
            descripcion_actividad = auth.descripcion_actividad,
            total_contratistas    = len(contratistas),
            aprobados             = sum(1 for c in contratistas if c.estado == "APROBADO"),
            pendientes            = sum(1 for c in contratistas if c.estado not in ("APROBADO", "DENEGADO")),
            contratistas          = [
                ContratistaResumenResponse.model_validate(c)
                for c in contratistas
            ],
        )


# ═══════════════════════════════════════════════════════════════════
# CONTRATISTAS
# ═══════════════════════════════════════════════════════════════════

class ContratistaPreliminarRequest(BaseModel):
    """
    Datos mínimos que el admin pre-llena por cada contratista
    al crear la autorización.
    """
    tipo_documento:   str = Field(..., pattern="^(CC|CE|PASAPORTE|TI)$")
    numero_documento: str = Field(..., min_length=5)
    nombres:          str = Field(..., min_length=2)
    apellidos:        str = Field(..., min_length=2)
    email:            EmailStr
    telefono:         str | None = None
    es_extranjero:    bool = False


class ContratistaTokenRequest(BaseModel):
    """Configuración del link de autogestión."""
    duracion_horas: int = Field(..., gt=0, description="24, 48, 72 o personalizado")


class ContratistaDenegarRequest(BaseModel):
    motivo: str = Field(..., min_length=10)


class ContratistaEliminarRequest(BaseModel):
    motivo: str = Field(..., min_length=10, description="Motivo obligatorio de la eliminación")


class ContratistaActualizarProveedorRequest(BaseModel):
    proveedor_id: int | None = None


class ContratistaResumenResponse(BaseModel):
    """Vista resumida para el panel del admin."""
    id:               int
    tipo_documento:   str
    numero_documento: str
    nombres:          str
    apellidos:        str
    email:            str
    estado:           str
    es_extranjero:    bool
    token_autogestion: str | None = None
    token_expira_en:  datetime | None
    autogestion_completada_en: datetime | None

    model_config = {"from_attributes": True}


class ContratistaDetalleResponse(BaseModel):
    """Vista completa para revisión en Gestión HSE."""
    id:               int
    autorizacion_id:  int
    tipo_documento:   str
    numero_documento: str
    nombres:          str
    apellidos:        str
    email:            str
    telefono:         str | None
    es_extranjero:    bool
    estado:           str
    motivo_denegacion: str | None
    token_autogestion: str | None
    token_expira_en:  datetime | None
    token_duracion_horas: int | None
    proveedor_id: int | None = None
    proveedor_nombre: str | None = None
    autogestion_completada_en: datetime | None
    sst_responsable_nombre:   str | None
    sst_responsable_telefono: str | None

    # Subtablas — None si no ha llenado aún
    clasificacion:       "ClasificacionResponse | None"       = None
    seguridad_social:    list["SegSocialResponse"]             = []
    certificaciones:     "CertificacionesResponse | None"     = None
    examen_medico:       "ExamenMedicoResponse | None"        = None
    contacto_emergencia: "ContactoEmergenciaResponse | None"  = None
    aceptacion_normas:   "AceptacionNormasResponse | None"    = None

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Wizard completo
# ═══════════════════════════════════════════════════════════════════

# ── Paso 1 — Datos personales ─────────────────────────────────────

class DatosPersonalesRequest(BaseModel):
    """Paso 2 del wizard — datos personales del contratista."""
    tipo_documento:      str = Field(..., pattern="^(CC|CE|PASAPORTE|TI)$")
    numero_documento:    str = Field(..., min_length=5)
    nombres:             str = Field(..., min_length=2)
    apellidos:           str = Field(..., min_length=2)
    email:               EmailStr
    telefono:            str | None = None
    es_extranjero:       bool = False
    ciudad_operacion:    str | None = None
    direccion_domicilio: str | None = None
    tipologia_hse:       str | None = None
    sst_responsable_nombre:   str | None = None
    sst_responsable_telefono: str | None = None
    tratamiento_datos:   bool = False


# ── Paso 3 — Clasificación de actividad ──────────────────────────

class ClasificacionRequest(BaseModel):
    """Paso 3 del wizard — 8 preguntas + campos condicionales."""

    # 8 preguntas SI/NO
    trabajo_alturas:     bool = False
    espacios_confinados: bool = False
    trabajo_electrico:   bool = False
    trabajo_caliente:    bool = False
    izaje_maquinaria:    bool = False
    visita_sin_riesgo:   bool = False
    personal_extranjero: bool = False
    genera_residuos:     bool = False

    # Alturas
    alturas_nivel:           str | None  = None
    alturas_cert_fecha_venc: date | None = None
    alturas_cert_archivo:    str | None  = None

    # Espacios confinados
    confinados_rol:          str | None  = None
    confinados_cert_fecha:   date | None = None
    confinados_cert_archivo: str | None  = None

    # Trabajo eléctrico
    electrico_matricula_contec:  str | None  = None
    electrico_num_matricula:     str | None  = None
    electrico_matricula_venc:    date | None = None
    electrico_matricula_archivo: str | None  = None

    # Trabajo en caliente
    caliente_extintor_fecha:   date | None = None
    caliente_extintor_archivo: str | None  = None
    caliente_permiso_fecha:    date | None = None
    caliente_permiso_archivo:  str | None  = None

    # Izaje
    izaje_tipo_equipo:        str | None = None
    izaje_inspeccion_archivo: str | None = None
    izaje_doc_legal_archivo:  str | None = None
    izaje_licencia_archivo:   str | None = None

    # Extranjero
    extran_aseguradora:    str | None  = None
    extran_num_poliza:     str | None  = None
    extran_poliza_venc:    date | None = None
    extran_poliza_archivo: str | None  = None

    # Residuos
    residuos_tipo:         str | None = None
    residuos_plan_archivo: str | None = None


class ClasificacionResponse(BaseModel):
    id:                  int
    contratista_id:      int
    trabajo_alturas:     bool
    espacios_confinados: bool
    trabajo_electrico:   bool
    trabajo_caliente:    bool
    izaje_maquinaria:    bool
    visita_sin_riesgo:   bool
    personal_extranjero: bool
    genera_residuos:     bool
    alturas_nivel:           str | None
    alturas_cert_fecha_venc: date | None
    alturas_cert_archivo:    str | None
    confinados_rol:          str | None
    confinados_cert_fecha:   date | None
    confinados_cert_archivo: str | None
    electrico_matricula_contec:  str | None
    electrico_num_matricula:     str | None
    electrico_matricula_venc:    date | None
    electrico_matricula_archivo: str | None
    caliente_extintor_fecha:   date | None
    caliente_extintor_archivo: str | None
    caliente_permiso_fecha:    date | None
    caliente_permiso_archivo:  str | None
    izaje_tipo_equipo:        str | None
    izaje_inspeccion_archivo: str | None
    izaje_doc_legal_archivo:  str | None
    izaje_licencia_archivo:   str | None
    extran_aseguradora:    str | None
    extran_num_poliza:     str | None
    extran_poliza_venc:    date | None
    extran_poliza_archivo: str | None
    residuos_tipo:         str | None
    residuos_plan_archivo: str | None

    model_config = {"from_attributes": True}


# ── Paso 4 — Seguridad social ─────────────────────────────────────

class SegSocialItemRequest(BaseModel):
    """Un registro de seguridad social — titular o miembro cuadrilla."""
    es_titular:     bool = True
    nombre_persona: str | None = None
    cedula_persona: str | None = None
    eps_id:         int | None = None
    eps_vigencia:   date | None = None
    arl_id:         int | None = None
    arl_vigencia:   date | None = None
    afp_id:         int | None = None
    afp_vigencia:   date | None = None
    pila_tipo:      str | None = Field(default=None, pattern="^(INTEGRADA|MANUAL|NO_APLICA)$")
    pila_estado:    str | None = Field(default=None, pattern="^(PENDIENTE|PAGADA|VENCIDA)$")
    pila_archivo:   str | None = None
    sst_tiene_vigente:       bool = False
    sst_responsable_nombre:  str | None = None
    sst_resolucion_registro: str | None = None


class SegSocialRequest(BaseModel):
    """Paso 4 del wizard — lista de personas con seguridad social."""
    personas: list[SegSocialItemRequest] = Field(..., min_length=1)


class SegSocialResponse(BaseModel):
    id:             int
    contratista_id: int
    es_titular:     bool
    nombre_persona: str | None
    cedula_persona: str | None
    eps_id:         int | None
    eps_vigencia:   date | None
    arl_id:         int | None
    arl_vigencia:   date | None
    afp_id:         int | None
    afp_vigencia:   date | None
    pila_tipo:      str | None
    pila_estado:    str | None
    pila_archivo:   str | None
    sst_tiene_vigente:       bool
    sst_responsable_nombre:  str | None
    sst_resolucion_registro: str | None

    model_config = {"from_attributes": True}


# ── Paso 5 — Certificaciones ──────────────────────────────────────

class CertificacionesRequest(BaseModel):
    """Paso 5 del wizard — ART y permiso de trabajo."""
    art_descripcion_tarea: str | None = None
    art_archivo:           str | None = None
    permiso_tipo:          str | None = None
    permiso_fecha:         date | None = None
    permiso_archivo:       str | None = None


class CertificacionesResponse(BaseModel):
    id:                    int
    contratista_id:        int
    art_descripcion_tarea: str | None
    art_archivo:           str | None
    permiso_tipo:          str | None
    permiso_fecha:         date | None
    permiso_archivo:       str | None

    model_config = {"from_attributes": True}


# ── Paso 6 — Examen médico ────────────────────────────────────────

class ExamenMedicoRequest(BaseModel):
    """Paso 6 del wizard — solo ALTO_RIESGO."""
    fecha_examen:            date | None = None
    concepto:                str | None = None
    descripcion_restriccion: str | None = None
    archivo:                 str | None = None


class ExamenMedicoResponse(BaseModel):
    id:                      int
    contratista_id:          int
    fecha_examen:            date | None
    concepto:                str | None
    descripcion_restriccion: str | None
    archivo:                 str | None

    model_config = {"from_attributes": True}


# ── Paso 7 — Contacto de emergencia ──────────────────────────────

class ContactoEmergenciaRequest(BaseModel):
    """Paso 7 del wizard — datos enriquecidos."""
    nombre_completo:  str = Field(..., min_length=3)
    relacion:         str = Field(..., pattern="^(FAMILIAR|CONYUGE|COLEGA|OTRO)$")
    relacion_otro:    str | None = None
    telefono_celular: str = Field(..., min_length=7)
    telefono_fijo:    str | None = None
    rh_sanguineo:     str | None = None
    alergias:         str | None = None
    condicion_medica: str | None = None
    eps_contratista:  str | None = None


class ContactoEmergenciaResponse(BaseModel):
    id:               int
    contratista_id:   int
    nombre_completo:  str
    relacion:         str
    relacion_otro:    str | None
    telefono_celular: str
    telefono_fijo:    str | None
    rh_sanguineo:     str | None
    alergias:         str | None
    condicion_medica: str | None
    eps_contratista:  str | None

    model_config = {"from_attributes": True}


# ── Paso 8 — Aceptación de normas ────────────────────────────────

class AceptacionNormasRequest(BaseModel):
    """Paso 8 del wizard — firma digital."""
    acepto_normas: bool = Field(..., description="Debe ser True para continuar")
    acepto_datos:  bool = Field(..., description="Debe ser True para continuar")
    firma_digital: str = Field(..., min_length=3, description="Nombre completo escrito")


class AceptacionNormasResponse(BaseModel):
    id:               int
    contratista_id:   int
    acepto_normas:    bool
    acepto_datos:     bool
    firma_digital:    str
    fecha_aceptacion: datetime | None
    ip_address:       str | None

    model_config = {"from_attributes": True}


# ── Autogestión completa (todos los pasos juntos) ─────────────────

class AutogestionValidarTokenResponse(BaseModel):
    """
    Respuesta al validar el token de autogestión.
    Retorna los datos pre-llenados por el admin
    para que el wizard los muestre al contratista.
    """
    contratista_id:   int
    autorizacion_id:  int
    tipo_documento:   str
    numero_documento: str
    nombres:          str
    apellidos:        str
    email:            str
    telefono:         str | None
    es_extranjero:    bool
    estado:           str
    sede_id:          int
    tipo_contratista: str
    empresa_proveedor: str | None = None
    descripcion_actividad: str
    fecha_inicio:     date
    fecha_fin:        date
    # Datos ya guardados (si el contratista ya había avanzado)
    clasificacion:       ClasificacionResponse | None       = None
    seguridad_social:    list[SegSocialResponse]             = []
    certificaciones:     CertificacionesResponse | None     = None
    examen_medico:       ExamenMedicoResponse | None        = None
    contacto_emergencia: ContactoEmergenciaResponse | None  = None
    aceptacion_normas:   AceptacionNormasResponse | None    = None


# ═══════════════════════════════════════════════════════════════════
# ACCESOS — Portería
# ═══════════════════════════════════════════════════════════════════

class VerificarAccesoRequest(BaseModel):
    """Request del vigilante al escanear una cédula."""
    numero_documento: str = Field(..., min_length=5)
    sede_id:          int


class VerificarAccesoResponse(BaseModel):
    """
    Resultado inmediato del escaneo.
    El vigilante ve esto en pantalla al instante.
    """
    estado:              str  # AUTORIZADO | NO_AUTORIZADO | NO_REGISTRADO | EXCEPCION
    color:               str  # green | red | gray | blue
    nombre:              str | None
    empresa:             str | None
    tipo_contratista:    str | None
    mensaje:             str
    problemas:           list[str] = []
    dentro_actualmente:  bool = False
    ultima_entrada:      datetime | None = None
    contratista_id:      int | None = None
    autorizacion_id:     int | None = None


class RegistrarAccesoRequest(BaseModel):
    """Registrar entrada o salida de un contratista."""
    contratista_id: int
    sede_id:        int
    tipo:           str = Field(..., pattern="^(ENTRADA|SALIDA)$")
    metodo:         str = Field(default="LECTOR_USB", pattern="^(CEDULA_MANUAL|LECTOR_USB|MANUAL_VIGILANTE)$")
    ubicacion_id:   int | None = None
    observacion:    str | None = None


class AccesoResponse(BaseModel):
    id:             int
    contratista_id: int
    sede_id:        int
    registrado_por: int
    tipo:           str
    metodo:         str
    observacion:    str | None
    fecha_hora:     datetime

    model_config = {"from_attributes": True}


class PersonaDentroResponse(BaseModel):
    """Info de una persona actualmente dentro de la sede."""
    contratista_id:   int
    nombre:           str
    numero_documento: str
    empresa:          str | None
    tipo_contratista: str
    hora_entrada:     datetime
    minutos_dentro:   int
    alerta_tiempo:    bool = False  # True si lleva más del tiempo autorizado


# ═══════════════════════════════════════════════════════════════════
# CUMPLIMIENTO
# ═══════════════════════════════════════════════════════════════════

class CumplimientoIniciarRequest(BaseModel):
    contratista_id: int
    sede_id:        int


class CumplimientoItemRequest(BaseModel):
    item_id:     int
    cumple:      bool | None = None
    observacion: str | None = None


class CumplimientoActualizarRequest(BaseModel):
    items:              list[CumplimientoItemRequest]
    observacion_general: str | None = None


class CumplimientoCerrarRequest(BaseModel):
    firma_digital:      str = Field(..., min_length=3)
    observacion_general: str | None = None


class CumplimientoItemResponse(BaseModel):
    id:          int
    pregunta:    str
    aplica:      bool
    cumple:      bool | None
    observacion: str | None
    orden:       int

    model_config = {"from_attributes": True}


class CumplimientoResponse(BaseModel):
    id:                  int
    contratista_id:      int
    sede_id:             int
    encargado_id:        int
    estado:              str
    observacion_general: str | None
    fecha_inicio:        datetime
    fecha_cierre:        datetime | None
    firma_digital:       str | None
    items:               list[CumplimientoItemResponse] = []

    model_config = {"from_attributes": True}


class CumplimientoListadoResponse(BaseModel):
    id:                 int
    estado:             str
    fecha_inicio:       datetime
    fecha_cierre:       datetime | None
    firma_digital:      str | None
    contratista_id:     int
    contratista_nombre: str
    tipo_documento:     str
    numero_documento:   str
    autorizacion_codigo: str | None = None
    proveedor_id:       int | None = None
    total_items:        int
    respondidos:        int


# ═══════════════════════════════════════════════════════════════════
# EXCEPCIONES
# ═══════════════════════════════════════════════════════════════════

class ExcepcionCreateRequest(BaseModel):
    persona_id:   int | None = None
    tipo_documento: str = Field("CC", pattern="^(CC|CE|PASAPORTE|TI|NIT)$")
    numero_documento: str | None = Field(None, min_length=5)
    nombre_completo: str | None = Field(None, min_length=3)
    sede_id:      int
    motivo:       str = Field(..., min_length=10)
    ubicacion_id: int | None = None
    fecha_inicio: date
    fecha_fin:    date


class ExcepcionLoteContratistaRequest(BaseModel):
    tipo_documento:   str = Field("CC", pattern="^(CC|CE|PASAPORTE|TI|NIT)$")
    numero_documento: str = Field(..., min_length=5)
    nombre_completo:  str = Field(..., min_length=3)


class ExcepcionLoteCreateRequest(BaseModel):
    sede_id:      int
    proveedor_id: int | None = None
    motivo:       str = Field(..., min_length=10)
    fecha_inicio: date
    fecha_fin:    date
    contratistas: list[ExcepcionLoteContratistaRequest] = Field(..., min_length=1)

class ExcepcionUpdateRequest(BaseModel):
    tipo_documento:   str = Field("CC", pattern="^(CC|CE|PASAPORTE|TI|NIT)$")
    numero_documento: str = Field(..., min_length=5)
    nombre_completo:  str = Field(..., min_length=3)
    proveedor_id:     int | None = None
    motivo:           str = Field(..., min_length=10)
    fecha_inicio:     date
    fecha_fin:        date

class ExcepcionResponse(BaseModel):
    id:           int
    persona_id:   int
    tipo_documento: str | None = None
    numero_documento: str | None = None
    nombre_completo: str | None = None
    proveedor_id: int | None = None
    proveedor_nombre: str | None = None
    origen_excepcion: str = "INDIVIDUAL"
    sede_id:      int
    aprobado_por: int
    motivo:       str
    ubicacion_id: int | None
    fecha_inicio: date
    fecha_fin:    date
    activa:       bool

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════
# HISTORIAL
# ═══════════════════════════════════════════════════════════════════

class HistorialResponse(BaseModel):
    id:              int
    contratista_id:  int
    usuario_id:      int | None
    estado_anterior: str | None
    estado_nuevo:    str
    motivo:          str | None
    metadata_extra:  dict[str, Any] | None
    created_at:      datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════
# DASHBOARD HSE
# ═══════════════════════════════════════════════════════════════════

class DashboardHSEResponse(BaseModel):
    """Métricas para el dashboard del ADMIN_HSE."""
    total_autorizaciones:      int
    autorizaciones_activas:    int
    autorizaciones_pendientes: int
    autorizaciones_vencidas:   int
    total_contratistas:        int
    contratistas_dentro_ahora: int
    alto_riesgo_activos:       int
    normal_activos:            int
    alertas_activas:           int


# Actualizar referencias forward
AutorizacionResponse.model_rebuild()
ContratistaDetalleResponse.model_rebuild()