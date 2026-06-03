/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Servicio HTTP del módulo HSE
 * Todas las llamadas al backend HSE pasan por aquí.
 */

import { get, post, put, del, upload, fetchBlob } from './api'
import type { SedeBasica } from '@/types'
import type {
  // Archivado
  SolicitudArchivadoResponse,
  AprobarArchivadoRequest,
  RechazarArchivadoRequest,
  // Reportes
  ReporteCumplimientoResponse,
  ReporteAccesoRow,
  ReporteVencimientoRow,
  ReporteContratistasResponse,
  ReporteAutorizacionesResponse,
  ChartDataResponse,
  // Contratistas
  ContratistaEliminarRequest,
  ContratistaEliminarAdjuntoRequest,
  // Catálogos
  CatItem,
  ProveedorHSEOption,
  ProveedorHSECreateRequest,
  ProveedorHSEUpdateRequest,
  Norma,
  // Autorizaciones
  AutorizacionCreateRequest,
  AutorizacionUpdateRequest,
  AutorizacionResponse,
  AutorizacionListResponse,
  // Contratistas
  ContratistaDetalleResponse,
  // Autogestión
  AutogestionTokenResponse,
  DatosPersonalesRequest,
  ClasificacionRequest,
  ClasificacionResponse,
  SegSocialItemRequest,
  SegSocialResponse,
  CertificacionesRequest,
  CertificacionesResponse,
  ExamenMedicoRequest,
  ExamenMedicoResponse,
  ContactoEmergenciaRequest,
  ContactoEmergenciaResponse,
  AceptacionNormasRequest,
  AceptacionNormasResponse,
  // Vigilante
  VerificarAccesoRequest,
  VerificarAccesoResponse,
  RegistrarAccesoRequest,
  AccesoResponse,
  PersonaDentroResponse,
  // Cumplimiento
  CumplimientoIniciarRequest,
  CumplimientoActualizarRequest,
  CumplimientoCerrarRequest,
  CumplimientoResponse,
  CumplimientoListadoResponse,
  // Excepciones
  ExcepcionCreateRequest,
  ExcepcionLoteCreateRequest,
  ExcepcionUpdateRequest,
  ExcepcionResponse,
  // Dashboard
  DashboardHSEResponse,
  UploadArchivoResponse,
} from '@/types/hse'

function sanitizeClasificacionRequest(data: ClasificacionRequest): ClasificacionRequest {
  return {
    trabajo_alturas: data.trabajo_alturas,
    espacios_confinados: data.espacios_confinados,
    trabajo_electrico: data.trabajo_electrico,
    trabajo_caliente: data.trabajo_caliente,
    izaje_maquinaria: data.izaje_maquinaria,
    visita_sin_riesgo: data.visita_sin_riesgo,
    personal_extranjero: data.personal_extranjero,
    genera_residuos: data.genera_residuos,
    alturas_nivel: data.alturas_nivel,
    alturas_cert_fecha_venc: data.alturas_cert_fecha_venc,
    alturas_cert_archivo: data.alturas_cert_archivo,
    confinados_rol: data.confinados_rol,
    confinados_cert_fecha: data.confinados_cert_fecha,
    confinados_cert_archivo: data.confinados_cert_archivo,
    electrico_matricula_contec: data.electrico_matricula_contec,
    electrico_num_matricula: data.electrico_num_matricula,
    electrico_matricula_venc: data.electrico_matricula_venc,
    electrico_matricula_archivo: data.electrico_matricula_archivo,
    caliente_extintor_fecha: data.caliente_extintor_fecha,
    caliente_extintor_archivo: data.caliente_extintor_archivo,
    caliente_permiso_fecha: data.caliente_permiso_fecha,
    caliente_permiso_archivo: data.caliente_permiso_archivo,
    izaje_tipo_equipo: data.izaje_tipo_equipo,
    izaje_inspeccion_archivo: data.izaje_inspeccion_archivo,
    izaje_doc_legal_archivo: data.izaje_doc_legal_archivo,
    izaje_licencia_archivo: data.izaje_licencia_archivo,
    extran_aseguradora: data.extran_aseguradora,
    extran_num_poliza: data.extran_num_poliza,
    extran_poliza_venc: data.extran_poliza_venc,
    extran_poliza_archivo: data.extran_poliza_archivo,
    residuos_tipo: data.residuos_tipo,
    residuos_plan_archivo: data.residuos_plan_archivo,
  }
}


// ═══════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════

export const hseService = {

  // ── Catálogos ──────────────────────────────────────────────────
  getSedes:  () => get<SedeBasica[]>('/hse/catalogos/sedes'),
  getEPS:    () => get<CatItem[]>('/hse/catalogos/eps'),
  getARL:    () => get<CatItem[]>('/hse/catalogos/arl'),
  getAFP:    () => get<CatItem[]>('/hse/catalogos/afp'),
  getNormas: (sedeId: number) => get<Norma[]>(`/hse/catalogos/normas/${sedeId}`),
  getProveedores: () => get<ProveedorHSEOption[]>('/hse/catalogos/proveedores'),
  crearProveedor: (data: ProveedorHSECreateRequest) =>
    post<ProveedorHSEOption>('/hse/catalogos/proveedores', data),

  actualizarProveedor: (id: number, data: ProveedorHSEUpdateRequest) =>
    put<ProveedorHSEOption>(`/hse/catalogos/proveedores/${id}`, data),

  eliminarProveedor: (id: number) =>
    del<null>(`/hse/catalogos/proveedores/${id}`),

  // ── Autorizaciones ─────────────────────────────────────────────
  listarAutorizaciones: (params: {
    sede_id:              number
    estado?:              string
    page?:                number
    per_page?:            number
    incluir_excepciones?: boolean
  }) => {
    const query = new URLSearchParams()
    query.set('sede_id', String(params.sede_id))
    if (params.estado)              query.set('estado',              params.estado)
    if (params.page)                query.set('page',                String(params.page))
    if (params.per_page)            query.set('per_page',            String(params.per_page))
    if (params.incluir_excepciones) query.set('incluir_excepciones', 'true')
    return get<AutorizacionListResponse[]>(`/hse/autorizaciones?${query.toString()}`)
  },

  crearAutorizacion: (data: AutorizacionCreateRequest) =>
    post<AutorizacionResponse>('/hse/autorizaciones', data),

  getAutorizacion: (id: number) =>
    get<AutorizacionResponse>(`/hse/autorizaciones/${id}`),

  actualizarAutorizacion: (id: number, data: AutorizacionUpdateRequest) =>
    put<AutorizacionResponse>(`/hse/autorizaciones/${id}`, data),

  eliminarAutorizacion: (id: number) =>
    del<null>(`/hse/autorizaciones/${id}`),

  // ── Contratistas ───────────────────────────────────────────────
  getContratista: (id: number) =>
    get<ContratistaDetalleResponse>(`/hse/contratistas/${id}`),

  aprobarContratista: (id: number) =>
    post<null>(`/hse/contratistas/${id}/aprobar`),

  denegarContratista: (id: number, motivo: string) =>
    post<null>(`/hse/contratistas/${id}/denegar`, { motivo }),

  renovarToken: (id: number, duracion_horas: number) =>
    post<string>(`/hse/contratistas/${id}/token`, { duracion_horas }),

  actualizarProveedorContratista: (id: number, proveedor_id: number | null) =>
    put<ContratistaDetalleResponse>(`/hse/contratistas/${id}/proveedor`, { proveedor_id }),

  eliminarContratista: (id: number, data: ContratistaEliminarRequest) =>
    post<null>(`/hse/contratistas/${id}/eliminar`, data),

  eliminarAdjuntoContratista: (id: number, data: ContratistaEliminarAdjuntoRequest) =>
    post<ContratistaDetalleResponse>(`/hse/contratistas/${id}/adjuntos/eliminar`, data),

  // ── Portal Autogestión (público) ───────────────────────────────
  validarToken: (token: string) =>
    get<AutogestionTokenResponse>(`/hse/autogestion/${token}`),

  uploadAutogestionArchivo: (
    token: string,
    payload: {
      modulo: 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen'
      campo: string
      file: File
    },
    onProgress?: (percent: number) => void,
  ) => {
    const formData = new FormData()
    formData.append('modulo', payload.modulo)
    formData.append('campo', payload.campo)
    formData.append('archivo', payload.file)
    return upload<UploadArchivoResponse>(`/hse/autogestion/${token}/upload`, formData, onProgress)
  },

  guardarDatosPersonales: (token: string, data: DatosPersonalesRequest) =>
    post<null>(`/hse/autogestion/${token}/datos-personales`, data),

  guardarClasificacion: (token: string, data: ClasificacionRequest) =>
    post<ClasificacionResponse>(`/hse/autogestion/${token}/clasificacion`, sanitizeClasificacionRequest(data)),

  guardarSeguridadSocial: (token: string, data: { personas: SegSocialItemRequest[] }) =>
    post<SegSocialResponse[]>(`/hse/autogestion/${token}/seguridad-social`, data),

  guardarCertificaciones: (token: string, data: CertificacionesRequest) =>
    post<CertificacionesResponse>(`/hse/autogestion/${token}/certificaciones`, data),

  guardarExamenMedico: (token: string, data: ExamenMedicoRequest) =>
    post<ExamenMedicoResponse>(`/hse/autogestion/${token}/examen-medico`, data),

  guardarContactoEmergencia: (token: string, data: ContactoEmergenciaRequest) =>
    post<ContactoEmergenciaResponse>(`/hse/autogestion/${token}/contacto-emergencia`, data),

  aceptarNormas: (token: string, data: AceptacionNormasRequest) =>
    post<AceptacionNormasResponse>(`/hse/autogestion/${token}/normas`, data),

  finalizarAutogestion: (token: string) =>
    post<{ success: boolean; message: string }>(`/hse/autogestion/${token}/finalizar`),

  // ── Portal Vigilante ───────────────────────────────────────────
  verificarAcceso: (data: VerificarAccesoRequest) =>
    post<VerificarAccesoResponse>('/hse/vigilante/verificar', data),

  registrarAcceso: (data: RegistrarAccesoRequest) =>
    post<AccesoResponse>('/hse/vigilante/acceso', {
      contratistaId: data.contratista_id,
      sedeId: data.sede_id,
      tipo: data.tipo,
      metodo: data.metodo,
      ubicacionId: data.ubicacion_id,
      observacion: data.observacion,
    }),

  getPersonasDentro: (sedeId: number) =>
    get<PersonaDentroResponse[]>(`/hse/vigilante/dentro/${sedeId}`),

  // ── Cumplimiento ───────────────────────────────────────────────
  iniciarCumplimiento: (data: CumplimientoIniciarRequest) =>
    post<CumplimientoResponse>('/hse/cumplimiento/iniciar', data),

  listarCumplimientos: (params: { sede_id: number; estado?: 'EN_PROGRESO' | 'COMPLETADO' | 'INCUMPLIMIENTO' }) => {
    const query = new URLSearchParams()
    query.set('sede_id', String(params.sede_id))
    if (params.estado) query.set('estado', params.estado)
    return get<CumplimientoListadoResponse[]>(`/hse/cumplimiento?${query.toString()}`)
  },

  getCumplimiento: (id: number) =>
    get<CumplimientoResponse>(`/hse/cumplimiento/${id}`),

  actualizarCumplimiento: (id: number, data: CumplimientoActualizarRequest) =>
    put<CumplimientoResponse>(`/hse/cumplimiento/${id}`, data),

  cerrarCumplimiento: (id: number, data: CumplimientoCerrarRequest) =>
    post<CumplimientoResponse>(`/hse/cumplimiento/${id}/cerrar`, data),

  // ── Excepciones ────────────────────────────────────────────────
  listarExcepciones: (sedeId: number) =>
    get<ExcepcionResponse[]>(`/hse/excepciones/${sedeId}`),

  crearExcepcion: (data: ExcepcionCreateRequest) =>
    post<ExcepcionResponse>('/hse/excepciones', data),

  crearExcepcionesLote: (data: ExcepcionLoteCreateRequest) =>
    post<ExcepcionResponse[]>('/hse/excepciones/lote', data),

  getExcepcion: (id: number) =>
    get<ExcepcionResponse>(`/hse/excepciones/detalle/${id}`),

  actualizarExcepcion: (id: number, data: ExcepcionUpdateRequest) =>
    put<ExcepcionResponse>(`/hse/excepciones/${id}`, data),

  desactivarExcepcion: (id: number) =>
    post<null>(`/hse/excepciones/${id}/desactivar`),

  activarExcepcion: (id: number) =>
    post<null>(`/hse/excepciones/${id}/activar`),

  eliminarExcepcion: (id: number) =>
    del<{ success: boolean; message: string }>(`/hse/excepciones/${id}`),

  // ── Dashboard ──────────────────────────────────────────────────
  getDashboard: (sedeId: number) =>
    get<DashboardHSEResponse>(`/hse/dashboard/${sedeId}`),

  // ── Reportes ───────────────────────────────────────────────────
  getReporteCumplimiento: (params: {
    sede_id?:      number
    fecha_inicio?: string
    fecha_fin?:    string
    estado?:       string
    page?:         number
    limit?:        number
  }) => {
    const qs = new URLSearchParams()
    if (params.sede_id)      qs.set('sede_id',      String(params.sede_id))
    if (params.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin)    qs.set('fecha_fin',    params.fecha_fin)
    if (params.estado)       qs.set('estado',       params.estado)
    if (params.page)         qs.set('page',         String(params.page))
    if (params.limit)        qs.set('limit',        String(params.limit))
    return get<ReporteCumplimientoResponse>(`/hse/reportes/cumplimiento?${qs.toString()}`)
  },

  getReporteAccesos: (params: {
    sede_id?:      number
    contratista_id?: number
    fecha_inicio?: string
    fecha_fin?:    string
  }) => {
    const qs = new URLSearchParams()
    if (params.sede_id)        qs.set('sede_id',        String(params.sede_id))
    if (params.contratista_id) qs.set('contratista_id', String(params.contratista_id))
    if (params.fecha_inicio)   qs.set('fecha_inicio',   params.fecha_inicio)
    if (params.fecha_fin)      qs.set('fecha_fin',      params.fecha_fin)
    return get<ReporteAccesoRow[]>(`/hse/reportes/accesos?${qs.toString()}`)
  },

  getReporteVencimientos: (params: { sede_id?: number }) => {
    const qs = new URLSearchParams()
    if (params.sede_id) qs.set('sede_id', String(params.sede_id))
    return get<ReporteVencimientoRow[]>(`/hse/reportes/vencimientos?${qs.toString()}`)
  },

  getReporteContratistas: (params: {
    sede_id?:      number
    estado?:       string
    fecha_inicio?: string
    fecha_fin?:    string
    page?:         number
    limit?:        number
  }) => {
    const qs = new URLSearchParams()
    if (params.sede_id)      qs.set('sede_id',      String(params.sede_id))
    if (params.estado)       qs.set('estado',       params.estado)
    if (params.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin)    qs.set('fecha_fin',    params.fecha_fin)
    if (params.page)         qs.set('page',         String(params.page))
    if (params.limit)        qs.set('limit',        String(params.limit))
    return get<ReporteContratistasResponse>(`/hse/reportes/contratistas?${qs.toString()}`)
  },

  getReporteAutorizaciones: (params: {
    sede_id?:         number
    estado?:          string
    tipo_contratista?: string
    fecha_inicio?:    string
    fecha_fin?:       string
    page?:            number
    limit?:           number
  }) => {
    const qs = new URLSearchParams()
    if (params.sede_id)          qs.set('sede_id',          String(params.sede_id))
    if (params.estado)           qs.set('estado',           params.estado)
    if (params.tipo_contratista) qs.set('tipo_contratista', params.tipo_contratista)
    if (params.fecha_inicio)     qs.set('fecha_inicio',     params.fecha_inicio)
    if (params.fecha_fin)        qs.set('fecha_fin',        params.fecha_fin)
    if (params.page)             qs.set('page',             String(params.page))
    if (params.limit)            qs.set('limit',            String(params.limit))
    return get<ReporteAutorizacionesResponse>(`/hse/reportes/autorizaciones?${qs.toString()}`)
  },

  getChartData: (sedeId: number) =>
    get<ChartDataResponse>(`/hse/reportes/charts?sede_id=${sedeId}`),

  // ── Archivado ──────────────────────────────────────────────────
  getColaArchivado: () =>
    get<SolicitudArchivadoResponse[]>('/hse/archivado/cola'),

  aprobarArchivado: (contratistaId: number, data: AprobarArchivadoRequest) =>
    post<SolicitudArchivadoResponse>(`/hse/archivado/${contratistaId}/aprobar`, data),

  rechazarArchivado: (contratistaId: number, data: RechazarArchivadoRequest) =>
    post<SolicitudArchivadoResponse>(`/hse/archivado/${contratistaId}/rechazar`, data),

  // ── Archivos de autogestión (admin) ───────────────────────────
  previsualizarArchivo: async (path: string): Promise<string> => {
    const blob = await fetchBlob(`/hse/archivos/${path}`)
    return URL.createObjectURL(blob)
  },

  descargarArchivo: async (path: string, nombreSugerido?: string): Promise<void> => {
    const blob = await fetchBlob(`/hse/archivos/${path}`)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = nombreSugerido ?? path.split('/').pop() ?? 'documento.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
