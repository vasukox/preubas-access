export type GhTipoCita =
  | 'INDUCCION'
  | 'FIRMA_CONTRATO'
  | 'ENTREGA_DOTACION'

export type GhEstadoCita =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_CURSO'
  | 'FINALIZADA'
  | 'NO_ASISTIO'
  | 'CANCELADA'

export interface GhCatalogoItem {
  id: string
  nombre: string
}

export interface GhCandidato {
  id: number
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  email: string | null
  telefono: string | null
}

export interface GhCandidatoBase {
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  email?: string | null
  telefono?: string | null
  contacto_emergencia?: string
}

export interface GhCita {
  id: number
  codigo: string
  sede_id: number
  tipo_cita: GhTipoCita
  estado: GhEstadoCita
  fecha_hora_inicio: string
  fecha_hora_fin: string
  observaciones: string | null
  candidato: GhCandidato
  sesion_induccion?: {
    sesion_id: number
    estado_sesion: GhEstadoSesionInduccion
    area: string
    tipo_induccion: string
  } | null
}

export interface GhCitaCreateRequest {
  candidato: {
    tipo_documento: string
    numero_documento: string
    nombres: string
    apellidos: string
    email?: string | null
    telefono?: string | null
  }
  sede_id: number
  tipo_cita: GhTipoCita
  fecha_hora_inicio: string
  fecha_hora_fin: string
  observaciones?: string | null
}

export interface GhCitaGrupoCreateRequest {
  candidatos: Array<{
    tipo_documento: string
    numero_documento: string
    nombres: string
    apellidos: string
    email?: string | null
    telefono?: string | null
  }>
  sede_id: number
  tipo_cita: GhTipoCita
  fecha_hora_inicio: string
  fecha_hora_fin: string
  observaciones?: string | null
}

export interface GhCitaUpdateRequest {
  tipo_cita?: GhTipoCita
  fecha_hora_inicio?: string
  fecha_hora_fin?: string
  observaciones?: string | null
}

export interface GhCitaEstadoRequest {
  estado: GhEstadoCita
  motivo?: string | null
}

export interface GhVigilanteVerificarRequest {
  sede_id: number
  tipo_documento: string
  numero_documento: string
}

export interface GhVigilanteVerificarResponse {
  estado: 'AUTORIZADO' | 'NO_AUTORIZADO' | 'NO_REGISTRADO'
  mensaje: string
  cita: GhCita | null
}

export interface GhPortalValidateResponse {
  token: string
  vigente: boolean
  expira_en: string
  cita: GhCita
}

export interface GhPortalConfirmRequest {
  confirmada: boolean
  comentario?: string | null
}

export interface GhPortalReagendarRequest {
  fecha_hora_inicio: string
  fecha_hora_fin: string
  comentario?: string | null
}

export interface GhPortalAccionResponse {
  token: string
  accion: 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR'
  cita: GhCita
}

export interface GhImportacionCreateRequest {
  sede_id: number
  nombre_archivo: string
}

export interface GhImportacion {
  id: number
  sede_id: number
  nombre_archivo: string
  estado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADA' | 'FALLIDA'
  filas_totales: number
  filas_exitosas: number
  filas_fallidas: number
  resumen_error: string | null
}

export interface GhImportacionDetalle {
  id: number
  numero_fila: number
  estado: string
  mensaje: string
  payload: Record<string, unknown> | null
}

export interface GhImportacionDetalleListado extends GhImportacion {
  detalles: GhImportacionDetalle[]
}

export interface GhDashboard {
  citas_hoy_total: number
  citas_hoy_confirmadas: number
  citas_hoy_no_asistio: number
  citas_en_curso: number
}

export type GhEstadoSesionInduccion =
  | 'PROGRAMADA'
  | 'EN_CURSO'
  | 'FINALIZADA'
  | 'CERRADA'
  | 'CANCELADA'

export type GhEstadoAsistenciaInduccion =
  | 'PENDIENTE'
  | 'CHECKIN_OK'
  | 'EN_SESION'
  | 'CHECKOUT_OK'
  | 'NO_ASISTIO'
  | 'SALIDA_PENDIENTE'

export interface GhSesionInduccionAsistencia {
  id: number
  candidato: GhCandidato
  estado_asistencia: GhEstadoAsistenciaInduccion
  token_autogestion: string
  checkin_at: string | null
  checkout_at: string | null
  intentos_codigo: number
  ultimo_error_codigo: string | null
}

export interface GhSesionInduccion {
  id: number
  sede_id: number
  area: string
  tipo_induccion: string
  responsable_usuario_id: number | null
  fecha_hora_inicio: string
  fecha_hora_fin: string
  estado_sesion: GhEstadoSesionInduccion
  codigo_checkin_actual: string | null
  codigo_checkout_actual: string | null
  fecha_cierre: string | null
  related_cita_ids: number[]
  asistentes: GhSesionInduccionAsistencia[]
}

export interface GhSesionInduccionCreateRequest {
  sede_id: number
  area: string
  tipo_induccion: string
  responsable_usuario_id?: number | null
  fecha_hora_inicio: string
  fecha_hora_fin: string
  cita_ids: number[]
  asistentes: Array<{
    tipo_documento: string
    numero_documento: string
    nombres: string
    apellidos: string
    email?: string | null
    telefono?: string | null
  }>
}

export interface GhCodigoTemporal {
  sesion_id: number
  tipo: 'CHECKIN' | 'CHECKOUT'
  codigo: string
  expira_en: string
}

export type GhEstadoEntregaDotacion =
  | 'PENDIENTE'
  | 'PARCIAL'
  | 'COMPLETA'
  | 'REPROGRAMADA'
  | 'ANULADA'

export type GhEstadoItemDotacion = 'PENDIENTE' | 'ENTREGADO' | 'FALTANTE'

export interface GhMaestroDotacion {
  id: number
  sede_id: number | null
  area: string
  cargo: string
  tipo_contrato: string
  kit_codigo: string
  kit_descripcion: string
  activo: boolean
}

export interface GhDotacionEntregaDetalle {
  id: number
  item_codigo: string
  item_nombre: string
  cantidad_esperada: number
  cantidad_entregada: number
  estado_item: GhEstadoItemDotacion
  evidencia_url: string | null
}

export interface GhDotacionEntrega {
  id: number
  candidato_id: number
  sesion_id: number | null
  cita_id: number | null
  estado_entrega: GhEstadoEntregaDotacion
  entregado_por_usuario_id: number | null
  fecha_entrega: string | null
  observaciones: string | null
  detalles: GhDotacionEntregaDetalle[]
}

export interface GhPortalInduccionValidateResponse {
  token: string
  vigente: boolean
  ventana_habilitada: boolean
  expira_en: string
  sesion_id: number
  estado_sesion: GhEstadoSesionInduccion
  candidato: GhCandidato
  estado_asistencia: GhEstadoAsistenciaInduccion
}

export interface GhPortalInduccionAccionResponse {
  token: string
  accion: 'CHECKIN' | 'CHECKOUT'
  estado_asistencia: GhEstadoAsistenciaInduccion
  timestamp: string
}

