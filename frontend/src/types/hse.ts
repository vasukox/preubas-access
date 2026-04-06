/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Tipos TypeScript del módulo HSE
 * Alineados 100% con el contrato de API del backend.
 */



// ═══════════════════════════════════════════════════════════════════
// ENUMS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════

export type TipoContratista     = 'ALTO_RIESGO' | 'NORMAL'
export type TipoDocumentoHSE    = 'CC' | 'CE' | 'PASAPORTE' | 'TI'
export type EstadoAutorizacion  =
  | 'BORRADOR'
  | 'PENDIENTE_AUTOGESTION'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'DENEGADO'
  | 'VENCIDO'

export type EstadoContratista =
  | 'PENDIENTE_AUTOGESTION'
  | 'AUTOGESTION_EN_PROGRESO'
  | 'AUTOGESTION_COMPLETADA'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'DENEGADO'

export type EstadoAccesoVigilante = 'AUTORIZADO' | 'NO_AUTORIZADO' | 'NO_REGISTRADO' | 'EXCEPCION'
export type TipoAccesoHSE         = 'ENTRADA' | 'SALIDA'
export type MetodoAccesoHSE       = 'CEDULA_MANUAL' | 'LECTOR_USB' | 'MANUAL_VIGILANTE'
export type EstadoCumplimiento    = 'EN_PROGRESO' | 'COMPLETADO' | 'INCUMPLIMIENTO'

export type AlturasNivel         = 'BASICO' | 'AVANZADO' | 'COORDINADOR'
export type ConfinadosRol        = 'SUPERVISOR' | 'VIGIA' | 'ENTRANTE'
export type ElectricoMatricula   = 'TE1' | 'TE2' | 'TE3' | 'TE4' | 'TE5' | 'TE6'
export type PilaTipo             = 'INTEGRADA' | 'MANUAL'
export type PilaEstado           = 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
export type PermisoTipo          = 'ALTURAS' | 'CONFINADOS' | 'CALIENTE' | 'ELECTRICO' | 'GENERAL'
export type ConceptoMedico       = 'APTO' | 'APTO_CON_RESTRICCION' | 'NO_APTO' | 'PENDIENTE'
export type RelacionEmergencia   = 'FAMILIAR' | 'CONYUGE' | 'COLEGA' | 'OTRO'
export type RHSanguineo          = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG'


// ═══════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════

export interface CatItem {
  id:     number
  nombre: string
  codigo: string
  activa: boolean
}

export interface ProveedorHSEOption {
  id: number
  nombre: string
  activo: boolean
}

export interface ProveedorHSECreateRequest {
  nombre: string
  nit: string
}

export interface ProveedorHSEUpdateRequest {
  nombre: string
  nit: string
  activo: boolean
}

export interface Norma {
  id:        number
  numero:    number
  titulo:    string
  contenido: string
  activa:    boolean
  sede_id:   number | null
}

export interface UploadArchivoResponse {
  modulo:       string
  campo:        string
  path:         string
  filename:     string
  content_type: string
  size_bytes:   number
}


// ═══════════════════════════════════════════════════════════════════
// AUTORIZACIONES
// ═══════════════════════════════════════════════════════════════════

export interface AutorizacionCreateRequest {
  proveedor_id?:           number
  sede_id:                 number
  responsable_interno_id?: number
  tipo_contratista:        TipoContratista
  descripcion_actividad:   string
  fecha_inicio:            string
  fecha_fin:               string
  contratistas:            ContratistaPreliminarRequest[]
}

export interface AutorizacionUpdateRequest {
  proveedor_id?:           number
  responsable_interno_id?: number
  tipo_contratista?:       TipoContratista
  descripcion_actividad?:  string
  fecha_inicio?:           string
  fecha_fin?:              string
}

export interface AutorizacionResponse {
  id:                     number
  codigo:                 string
  proveedor_id:           number | null
  sede_id:                number
  creado_por:             number
  responsable_interno_id: number | null
  tipo_contratista:       TipoContratista
  descripcion_actividad:  string
  fecha_inicio:           string
  fecha_fin:              string
  estado:                 EstadoAutorizacion
  motivo_denegacion:      string | null
  created_at:             string
  updated_at:             string
  contratistas:           ContratistaResumenResponse[]
}

export interface AutorizacionListResponse {
  id:                 number
  codigo:             string
  tipo_contratista:   TipoContratista
  estado:             EstadoAutorizacion
  fecha_inicio:       string
  fecha_fin:          string
  sede_id:            number
  proveedor_id?:      number | null
  descripcion_actividad?: string
  total_contratistas: number
  aprobados:          number
  pendientes:         number
  contratistas:       ContratistaResumenResponse[]
}


// ═══════════════════════════════════════════════════════════════════
// CONTRATISTAS
// ═══════════════════════════════════════════════════════════════════

export interface ContratistaEliminarRequest {
  motivo: string
}

export interface ContratistaPreliminarRequest {
  tipo_documento:   TipoDocumentoHSE
  numero_documento: string
  nombres:          string
  apellidos:        string
  email:            string
  telefono?:        string
  es_extranjero?:   boolean
}

export interface ContratistaResumenResponse {
  id:                        number
  tipo_documento:            TipoDocumentoHSE
  numero_documento:          string
  nombres:                   string
  apellidos:                 string
  email:                     string
  estado:                    EstadoContratista
  es_extranjero:             boolean
  token_autogestion:         string | null
  token_expira_en:           string | null
  autogestion_completada_en: string | null
}

export interface ContratistaDetalleResponse {
  id:                        number
  autorizacion_id:           number
  tipo_documento:            TipoDocumentoHSE
  numero_documento:          string
  nombres:                   string
  apellidos:                 string
  email:                     string
  telefono:                  string | null
  es_extranjero:             boolean
  estado:                    EstadoContratista
  motivo_denegacion:         string | null
  token_autogestion:         string | null
  token_expira_en:           string | null
  token_duracion_horas:      number | null
  proveedor_id:              number | null
  proveedor_nombre:          string | null
  autogestion_completada_en: string | null
  sst_responsable_nombre:    string | null
  sst_responsable_telefono:  string | null
  clasificacion:             ClasificacionResponse | null
  seguridad_social:          SegSocialResponse[]
  certificaciones:           CertificacionesResponse | null
  examen_medico:             ExamenMedicoResponse | null
  contacto_emergencia:       ContactoEmergenciaResponse | null
  aceptacion_normas:         AceptacionNormasResponse | null
}


// ═══════════════════════════════════════════════════════════════════
// AUTOGESTIÓN — Wizard completo
// ═══════════════════════════════════════════════════════════════════

export interface AutogestionTokenResponse {
  contratista_id:        number
  autorizacion_id:       number
  tipo_documento:        TipoDocumentoHSE
  numero_documento:      string
  nombres:               string
  apellidos:             string
  email:                 string
  telefono:              string | null
  es_extranjero:         boolean
  estado:                EstadoContratista
  sede_id:               number
  tipo_contratista:      TipoContratista
  empresa_proveedor:     string | null
  descripcion_actividad: string
  fecha_inicio:          string
  fecha_fin:             string
  clasificacion:         ClasificacionResponse | null
  seguridad_social:      SegSocialResponse[]
  certificaciones:       CertificacionesResponse | null
  examen_medico:         ExamenMedicoResponse | null
  contacto_emergencia:   ContactoEmergenciaResponse | null
  aceptacion_normas:     AceptacionNormasResponse | null
}

export interface DatosPersonalesRequest {
  tipo_documento:           TipoDocumentoHSE
  numero_documento:         string
  nombres:                  string
  apellidos:                string
  email:                    string
  telefono?:                string
  es_extranjero?:           boolean
  ciudad_operacion?:        string
  direccion_domicilio?:     string
  tipologia_hse?:           string
  sst_responsable_nombre?:  string
  sst_responsable_telefono?: string
  tratamiento_datos?:       boolean
}

export interface ClasificacionRequest {
  trabajo_alturas?:     boolean
  espacios_confinados?: boolean
  trabajo_electrico?:   boolean
  trabajo_caliente?:    boolean
  izaje_maquinaria?:    boolean
  visita_sin_riesgo?:   boolean
  personal_extranjero?: boolean
  genera_residuos?:     boolean
  // Alturas
  alturas_nivel?:           AlturasNivel
  alturas_cert_fecha_venc?: string
  alturas_cert_archivo?:    string
  // Espacios confinados
  confinados_rol?:          ConfinadosRol
  confinados_cert_fecha?:   string
  confinados_cert_archivo?: string
  // Eléctrico
  electrico_matricula_contec?:  ElectricoMatricula
  electrico_num_matricula?:     string
  electrico_matricula_venc?:    string
  electrico_matricula_archivo?: string
  // Caliente
  caliente_extintor_fecha?:   string
  caliente_extintor_archivo?: string
  caliente_permiso_fecha?:    string
  caliente_permiso_archivo?:  string
  // Izaje
  izaje_tipo_equipo?:        string
  izaje_inspeccion_archivo?: string
  izaje_doc_legal_archivo?:  string
  izaje_licencia_archivo?:   string
  // Extranjero
  extran_aseguradora?:    string
  extran_num_poliza?:     string
  extran_poliza_venc?:    string
  extran_poliza_archivo?: string
  // Residuos
  residuos_tipo?:         string
  residuos_plan_archivo?: string
}

export interface ClasificacionResponse extends ClasificacionRequest {
  id:             number
  contratista_id: number
}

export interface SegSocialItemRequest {
  es_titular?:     boolean
  nombre_persona?: string
  cedula_persona?: string
  eps_id?:         number
  eps_vigencia?:   string
  arl_id?:         number
  arl_vigencia?:   string
  afp_id?:         number
  afp_vigencia?:   string
  pila_tipo?:      PilaTipo
  pila_estado?:    PilaEstado
  pila_archivo?:   string
  sst_tiene_vigente?:       boolean
  sst_responsable_nombre?:  string
  sst_resolucion_registro?: string
}

export interface SegSocialResponse extends SegSocialItemRequest {
  id:             number
  contratista_id: number
}

export interface CertificacionesRequest {
  art_descripcion_tarea?: string
  art_archivo?:           string
  permiso_tipo?:          PermisoTipo
  permiso_fecha?:         string
  permiso_archivo?:       string
}

export interface CertificacionesResponse extends CertificacionesRequest {
  id:             number
  contratista_id: number
}

export interface ExamenMedicoRequest {
  fecha_examen?:            string
  concepto?:                ConceptoMedico
  descripcion_restriccion?: string
  archivo?:                 string
}

export interface ExamenMedicoResponse extends ExamenMedicoRequest {
  id:             number
  contratista_id: number
}

export interface ContactoEmergenciaRequest {
  nombre_completo:  string
  relacion:         RelacionEmergencia
  relacion_otro?:   string
  telefono_celular: string
  telefono_fijo?:   string
  rh_sanguineo?:    RHSanguineo
  alergias?:        string
  condicion_medica?: string
  eps_contratista?: string
}

export interface ContactoEmergenciaResponse extends ContactoEmergenciaRequest {
  id:             number
  contratista_id: number
}

export interface AceptacionNormasRequest {
  acepto_normas: boolean
  acepto_datos:  boolean
  firma_digital: string
}

export interface AceptacionNormasResponse extends AceptacionNormasRequest {
  id:               number
  contratista_id:   number
  fecha_aceptacion: string | null
  ip_address:       string | null
}


// ═══════════════════════════════════════════════════════════════════
// PORTAL VIGILANTE
// ═══════════════════════════════════════════════════════════════════

export interface VerificarAccesoRequest {
  numero_documento: string
  sede_id:          number
}

export interface VerificarAccesoResponse {
  estado:             EstadoAccesoVigilante
  color:              'green' | 'red' | 'gray' | 'blue'
  nombre:             string | null
  empresa:            string | null
  tipo_contratista:   TipoContratista | null
  mensaje:            string
  problemas:          string[]
  dentro_actualmente: boolean
  ultima_entrada:     string | null
  contratista_id:     number | null
  autorizacion_id:    number | null
}

export interface RegistrarAccesoRequest {
  contratista_id: number
  sede_id:        number
  tipo:           TipoAccesoHSE
  metodo?:        MetodoAccesoHSE
  ubicacion_id?:  number
  observacion?:   string
}

export interface AccesoResponse {
  id:             number
  contratista_id: number
  sede_id:        number
  registrado_por: number
  tipo:           TipoAccesoHSE
  metodo:         MetodoAccesoHSE
  observacion:    string | null
  fecha_hora:     string
}

export interface PersonaDentroResponse {
  contratista_id:   number
  nombre:           string
  numero_documento: string
  empresa:          string | null
  tipo_contratista: TipoContratista
  hora_entrada:     string
  minutos_dentro:   number
  alerta_tiempo:    boolean
}


// ═══════════════════════════════════════════════════════════════════
// CUMPLIMIENTO
// ═══════════════════════════════════════════════════════════════════

export interface CumplimientoIniciarRequest {
  contratista_id: number
  sede_id:        number
}

export interface CumplimientoItemRequest {
  item_id:      number
  cumple?:      boolean
  observacion?: string
}

export interface CumplimientoActualizarRequest {
  items:               CumplimientoItemRequest[]
  observacion_general?: string
}

export interface CumplimientoCerrarRequest {
  firma_digital:        string
  observacion_general?: string
}

export interface CumplimientoItemResponse {
  id:          number
  pregunta:    string
  aplica:      boolean
  cumple:      boolean | null
  observacion: string | null
  orden:       number
}

export interface CumplimientoResponse {
  id:                  number
  contratista_id:      number
  sede_id:             number
  encargado_id:        number
  estado:              EstadoCumplimiento
  observacion_general: string | null
  fecha_inicio:        string
  fecha_cierre:        string | null
  firma_digital:       string | null
  items:               CumplimientoItemResponse[]
}

export interface CumplimientoListadoResponse {
  id:                 number
  estado:             EstadoCumplimiento
  fecha_inicio:       string
  fecha_cierre:       string | null
  firma_digital:      string | null
  contratista_id:     number
  contratista_nombre: string
  tipo_documento:     TipoDocumentoHSE
  numero_documento:   string
  autorizacion_codigo: string | null
  proveedor_id:       number | null
  total_items:        number
  respondidos:        number
}


// ═══════════════════════════════════════════════════════════════════
// EXCEPCIONES
// ═══════════════════════════════════════════════════════════════════

export interface ExcepcionCreateRequest {
  persona_id?:   number
  tipo_documento?: 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'NIT'
  numero_documento?: string
  nombre_completo?: string
  sede_id:      number
  motivo:       string
  ubicacion_id?: number
  fecha_inicio: string
  fecha_fin:    string
}

export interface ExcepcionLoteContratistaRequest {
  tipo_documento?: 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'NIT'
  numero_documento: string
  nombre_completo: string
}

export interface ExcepcionLoteCreateRequest {
  sede_id: number
  proveedor_id?: number
  motivo: string
  fecha_inicio: string
  fecha_fin: string
  contratistas: ExcepcionLoteContratistaRequest[]
}

export interface ExcepcionUpdateRequest {
  tipo_documento: 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'NIT'
  numero_documento: string
  nombre_completo: string
  proveedor_id?: number | null
  motivo: string
  fecha_inicio: string
  fecha_fin: string
}

export interface ExcepcionResponse {
  id:           number
  persona_id:   number
  tipo_documento: string | null
  numero_documento: string | null
  nombre_completo: string | null
  proveedor_id: number | null
  proveedor_nombre: string | null
  origen_excepcion: 'INDIVIDUAL' | 'EMPRESA'
  sede_id:      number
  aprobado_por: number
  motivo:       string
  ubicacion_id: number | null
  fecha_inicio: string
  fecha_fin:    string
  activa:       boolean
}


// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export interface DashboardHSEResponse {
  total_autorizaciones:      number
  autorizaciones_activas:    number
  autorizaciones_pendientes: number
  autorizaciones_vencidas:   number
  total_contratistas:        number
  contratistas_dentro_ahora: number
  alto_riesgo_activos:       number
  normal_activos:            number
  alertas_activas:           number
}


// ═══════════════════════════════════════════════════════════════════
// HELPERS DE UI
// ═══════════════════════════════════════════════════════════════════

export const ESTADO_AUTORIZACION_LABEL: Record<EstadoAutorizacion, string> = {
  BORRADOR:              'Borrador',
  PENDIENTE_AUTOGESTION: 'Pendiente autogestión',
  EN_REVISION:           'En revisión',
  APROBADO:              'Aprobado',
  DENEGADO:              'Denegado',
  VENCIDO:               'Vencido',
}

export const ESTADO_AUTORIZACION_COLOR: Record<EstadoAutorizacion, string> = {
  BORRADOR:              'var(--text-muted)',
  PENDIENTE_AUTOGESTION: 'var(--primary-400)',
  EN_REVISION:           '#6366F1',
  APROBADO:              'var(--success-400)',
  DENEGADO:              'var(--danger-400)',
  VENCIDO:               'var(--text-muted)',
}

export const ESTADO_CONTRATISTA_LABEL: Record<EstadoContratista, string> = {
  PENDIENTE_AUTOGESTION:   'Pendiente',
  AUTOGESTION_EN_PROGRESO: 'En progreso',
  AUTOGESTION_COMPLETADA:  'Completada',
  EN_REVISION:             'En revisión',
  APROBADO:                'Aprobado',
  DENEGADO:                'Denegado',
}

export const TIPO_CONTRATISTA_LABEL: Record<TipoContratista, string> = {
  ALTO_RIESGO: 'Alto Riesgo',
  NORMAL:      'Normal',
}