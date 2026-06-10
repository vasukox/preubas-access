import { get, post, put, del } from './api'

export interface DashboardParkingOcupacion {
  total:       number
  ocupados:    number
  disponibles: number
  porcentaje:  number
}

export interface DashboardParkingZona {
  id:              number
  nombre:          string
  capacidad_total: number
  ocupados:        number
  disponibles:     number
  porcentaje:      number
}

export interface DashboardParkingAcceso {
  id:          number
  placa:       string
  tipo_acceso: 'ENTRADA' | 'SALIDA'
  resultado:   string
  metodo:      string
  zona:        string | null
  numero_cupo: string | null
  fecha_hora:  string
}

export interface DashboardParking {
  ocupacion_actual:           DashboardParkingOcupacion
  solicitudes_pendientes:     number
  autorizaciones_activas:     number
  autorizaciones_por_vencer:  number
  novedades_activas:          number
  documentos_por_vencer:      number
  vehiculos_dentro:           number
  zonas:                      DashboardParkingZona[]
  actividad_reciente:         DashboardParkingAcceso[]
}

// ── Solicitudes — Enums / Types ───────────────────────────────────

export type EstadoSolicitudParkingFull =
  | 'BORRADOR'
  | 'PENDIENTE_AUTOGESTION'
  | 'AUTOGESTION_EN_PROGRESO'
  | 'AUTOGESTION_COMPLETADA'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'DENEGADO'
  | 'VENCIDO'
  | 'SUSPENDIDO'
  | 'REVOCADO'

export type TipoVehiculoParkingFull =
  | 'CARRO' | 'MOTO' | 'BICICLETA' | 'CAMION' | 'VAN' | 'TAXI_AUTORIZADO' | 'ELECTRICO'

export type TipoUsuarioParkingFull =
  | 'COLABORADOR' | 'DIRECTIVO' | 'VISITANTE_RECURRENTE' | 'PROVEEDOR'
  | 'CONTRATISTA' | 'TRANSPORTE' | 'MENSAJERIA' | 'TEMPORAL'

export type TipoAutorizacionParkingFull =
  | 'SIN_CUPO_FIJO' | 'CON_CUPO_FIJO' | 'POR_HORARIO' | 'DIAS_ESPECIFICOS'
  | 'TEMPORAL' | 'INGRESO_SIN_PERMANENCIA' | 'POR_EXCEPCION'

export interface PersonaSolicitud {
  id: number
  nombres: string
  apellidos: string
  numero_documento: string
  email?: string
}

export interface DocumentoSolicitud {
  id: number
  tipo_documento: string
  nombre_archivo: string
  ruta_archivo: string
  fecha_vencimiento: string | null
  estado: string
}

export interface HistorialSolicitud {
  evento: string
  descripcion: string
  estado_anterior: string | null
  estado_nuevo: string | null
  usuario: { id: number; nombre: string }
  fecha_hora: string
}

export interface AutorizacionSolicitud {
  id: number
  tipo_autorizacion: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
}

export interface SolicitudResumen {
  id: number
  codigo: string
  placa: string
  tipo_vehiculo: TipoVehiculoParkingFull
  tipo_usuario: TipoUsuarioParkingFull
  estado: EstadoSolicitudParkingFull
  fecha_inicio: string
  fecha_fin: string
  sede: { id: number; nombre: string }
  persona: PersonaSolicitud | null
  solicitante_nombre: string | null
  solicitante_cedula: string | null
  created_at: string
}

export interface SolicitudDetalle extends SolicitudResumen {
  marca: string | null
  linea: string | null
  color: string | null
  modelo_anio: number | null
  horario_requerido: string | null
  dias_requeridos: string[] | null
  motivo: string | null
  token_autogestion: string | null
  token_expira_en: string | null
  autogestion_completada_en: string | null
  observaciones_internas: string | null
  motivo_denegacion: string | null
  creador: { id: number; nombre: string }
  aprobador: { id: number; nombre: string } | null
  documentos: DocumentoSolicitud[]
  autorizacion: AutorizacionSolicitud | null
  historial: HistorialSolicitud[]
  updated_at: string
}

export interface PaginatedSolicitudes {
  items: SolicitudResumen[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ListarSolicitudesParams {
  sede_id?: number
  estado?: string
  tipo_usuario?: string
  tipo_vehiculo?: string
  placa?: string
  page?: number
  per_page?: number
}

export interface CreateSolicitudPayload {
  sede_id: number
  tipo_usuario: TipoUsuarioParkingFull
  tipo_vehiculo: TipoVehiculoParkingFull
  placa: string
  solicitante_nombre?: string
  solicitante_cedula?: string
  marca?: string
  linea?: string
  color?: string
  modelo_anio?: number
  horario_requerido?: string
  dias_requeridos?: string[]
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}

export interface AutogestionPortalData {
  solicitud_id: number
  codigo: string
  sede: { id: number; nombre: string } | null
  tipo_usuario: TipoUsuarioParkingFull
  tipo_vehiculo: TipoVehiculoParkingFull
  estado: EstadoSolicitudParkingFull
  fecha_inicio: string
  fecha_fin: string
  placa: string
  solicitante_nombre: string | null
  solicitante_cedula: string | null
  token_expira_en: string
}

export interface CompletarAutogestionPayload {
  marca: string
  linea: string
  color: string
  modelo_anio?: number
  horario_requerido: string
  dias_requeridos?: string[]
  motivo: string
  nombres?: string
  apellidos?: string
  email?: string
  telefono?: string
}

export interface AprobarPayload {
  tipo_autorizacion: TipoAutorizacionParkingFull
  cupo_id?: number | null
  dias_permitidos?: string[]
  horario_inicio?: string
  horario_fin?: string
  observaciones?: string
}

export interface EnviarTokenResult {
  estado: string
  token_autogestion: string
  token_expira_en: string
  link_autogestion: string
}

export interface AprobarResult {
  solicitud: { id: number; estado: string }
  autorizacion: AutorizacionSolicitud
}

// ── Service ───────────────────────────────────────────────────────

export const parkingService = {
  // Dashboard
  getDashboard: (sedeId: number): Promise<DashboardParking> =>
    get<DashboardParking>(`/parking/dashboard/${sedeId}`),

  // Solicitudes — CRUD
  getSolicitudes: (params: ListarSolicitudesParams): Promise<PaginatedSolicitudes> =>
    get<PaginatedSolicitudes>('/parking/solicitudes', { params }),
  getSolicitud: (id: number): Promise<SolicitudDetalle> =>
    get<SolicitudDetalle>(`/parking/solicitudes/${id}`),
  createSolicitud: (payload: CreateSolicitudPayload): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>('/parking/solicitudes', payload),
  updateSolicitud: (id: number, payload: Partial<CreateSolicitudPayload>): Promise<SolicitudDetalle> =>
    put<SolicitudDetalle>(`/parking/solicitudes/${id}`, payload),
  deleteSolicitud: (id: number): Promise<{ message: string }> =>
    del<{ message: string }>(`/parking/solicitudes/${id}`),

  // Portal de autogestión (público)
  getAutogestion: (token: string): Promise<AutogestionPortalData> =>
    get<AutogestionPortalData>(`/parking/autogestion/${token}`),
  completarAutogestion: (token: string, payload: CompletarAutogestionPayload): Promise<{ success: boolean; mensaje: string }> =>
    post<{ success: boolean; mensaje: string }>(`/parking/autogestion/${token}/completar`, payload),

  // Solicitudes — acciones de estado
  enviarSolicitud: (id: number): Promise<EnviarTokenResult> =>
    post<EnviarTokenResult>(`/parking/solicitudes/${id}/enviar`),
  regenerarToken: (id: number, duracion_horas = 72): Promise<EnviarTokenResult> =>
    post<EnviarTokenResult>(`/parking/solicitudes/${id}/token`, { duracion_horas }),
  tomarSolicitud: (id: number): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>(`/parking/solicitudes/${id}/tomar`),
  aprobarSolicitud: (id: number, payload: AprobarPayload): Promise<AprobarResult> =>
    post<AprobarResult>(`/parking/solicitudes/${id}/aprobar`, payload),
  denegarSolicitud: (id: number, motivo_denegacion: string): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>(`/parking/solicitudes/${id}/denegar`, { motivo_denegacion }),
  solicitarCorreccion: (id: number, observaciones: string): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>(`/parking/solicitudes/${id}/solicitar-correccion`, { observaciones }),
  suspenderSolicitud: (id: number, motivo: string): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>(`/parking/solicitudes/${id}/suspender`, { motivo }),
  revocarSolicitud: (id: number, motivo: string): Promise<SolicitudDetalle> =>
    post<SolicitudDetalle>(`/parking/solicitudes/${id}/revocar`, { motivo }),
}
