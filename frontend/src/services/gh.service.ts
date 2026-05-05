import { del, get, post, put } from './api'
import type {
  GhCatalogoItem,
  GhCita,
  GhCitaCreateRequest,
  GhCitaGrupoCreateRequest,
  GhCitaEstadoRequest,
  GhTipoCita,
  GhCitaUpdateRequest,
  GhDashboard,
  GhImportacionDetalleListado,
  GhImportacion,
  GhImportacionCreateRequest,
  GhPortalAccionResponse,
  GhPortalConfirmRequest,
  GhPortalReagendarRequest,
  GhPortalValidateResponse,
  GhVigilanteVerificarRequest,
  GhVigilanteVerificarResponse,
  GhSesionInduccion,
  GhSesionInduccionCreateRequest,
  GhCodigoTemporal,
  GhMaestroDotacion,
  GhDotacionEntrega,
  GhPortalInduccionValidateResponse,
  GhPortalInduccionAccionResponse,
} from '@/types/gh'

export const ghService = {
  getTiposCita: () => get<GhCatalogoItem[]>('/gh/catalogos/tipos-cita'),
  getEstadosCita: () => get<GhCatalogoItem[]>('/gh/catalogos/estados-cita'),

  listarCitas: (params: {
    sede_id: number
    estado?: string
    tipo_cita?: GhTipoCita
    busqueda?: string
    fecha_desde?: string
    fecha_hasta?: string
    page?: number
    per_page?: number
  }) => {
    const query = new URLSearchParams()
    query.set('sede_id', String(params.sede_id))
    if (params.estado) query.set('estado', params.estado)
    if (params.tipo_cita) query.set('tipo_cita', params.tipo_cita)
    if (params.busqueda) query.set('busqueda', params.busqueda)
    if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde)
    if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta)
    if (params.page) query.set('page', String(params.page))
    if (params.per_page) query.set('per_page', String(params.per_page))
    return get<GhCita[]>(`/gh/citas?${query.toString()}`)
  },

  getCita: (id: number) => get<GhCita>(`/gh/citas/${id}`),
  crearCita: (data: GhCitaCreateRequest) => post<GhCita>('/gh/citas', data),
  crearCitasGrupo: (data: GhCitaGrupoCreateRequest) => post<GhCita[]>('/gh/citas/grupo', data),
  actualizarCita: (id: number, data: GhCitaUpdateRequest) => put<GhCita>(`/gh/citas/${id}`, data),
  cambiarEstadoCita: (id: number, data: GhCitaEstadoRequest) =>
    post<GhCita>(`/gh/citas/${id}/estado`, data),
  eliminarCita: (id: number) => del<null>(`/gh/citas/${id}`),

  validarPortal: (token: string) => get<GhPortalValidateResponse>(`/gh/portal/${token}`),
  confirmarPortal: (token: string, data: GhPortalConfirmRequest) =>
    post<GhPortalAccionResponse>(`/gh/portal/${token}/confirmar`, data),
  reagendarPortal: (token: string, data: GhPortalReagendarRequest) =>
    post<GhPortalAccionResponse>(`/gh/portal/${token}/reagendar`, data),

  verificarVigilante: (data: GhVigilanteVerificarRequest) =>
    post<GhVigilanteVerificarResponse>('/gh/vigilante/verificar', data),

  crearImportacion: (data: GhImportacionCreateRequest) =>
    post<GhImportacion>('/gh/importaciones', data),
  getImportacion: (id: number) => get<GhImportacionDetalleListado>(`/gh/importaciones/${id}`),

  getDashboard: (sedeId: number) => get<GhDashboard>(`/gh/dashboard/${sedeId}`),

  listarSesionesInduccion: (params?: { sede_id?: number; estado_sesion?: string }) => {
    const query = new URLSearchParams()
    if (params?.sede_id) query.set('sede_id', String(params.sede_id))
    if (params?.estado_sesion) query.set('estado_sesion', params.estado_sesion)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return get<GhSesionInduccion[]>(`/gh/inducciones/sesiones${suffix}`)
  },
  crearSesionInduccion: (data: GhSesionInduccionCreateRequest) =>
    post<GhSesionInduccion>('/gh/inducciones/sesiones', data),
  cambiarEstadoSesionInduccion: (id: number, data: { estado_sesion: string; motivo?: string }) =>
    post<GhSesionInduccion>(`/gh/inducciones/sesiones/${id}/estado`, data),
  generarCodigoCheckin: (sesionId: number) =>
    post<GhCodigoTemporal>(`/gh/inducciones/sesiones/${sesionId}/generar-codigo-checkin`, {}),
  generarCodigoCheckout: (sesionId: number) =>
    post<GhCodigoTemporal>(`/gh/inducciones/sesiones/${sesionId}/generar-codigo-checkout`, {}),
  enviarLinksInduccion: (sesionId: number) =>
    post<{ enviados: number }>(`/gh/inducciones/sesiones/${sesionId}/enviar-links`, {}),

  listarMaestroDotacion: (params?: {
    sede_id?: number
    area?: string
    cargo?: string
    tipo_contrato?: string
    activos_only?: boolean
  }) => {
    const query = new URLSearchParams()
    if (params?.sede_id) query.set('sede_id', String(params.sede_id))
    if (params?.area) query.set('area', params.area)
    if (params?.cargo) query.set('cargo', params.cargo)
    if (params?.tipo_contrato) query.set('tipo_contrato', params.tipo_contrato)
    if (params?.activos_only !== undefined) query.set('activos_only', String(params.activos_only))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return get<GhMaestroDotacion[]>(`/gh/dotacion/maestro${suffix}`)
  },
  crearMaestroDotacion: (data: {
    sede_id?: number | null
    area: string
    cargo: string
    tipo_contrato: string
    kit_codigo: string
    kit_descripcion: string
    activo: boolean
  }) => post<GhMaestroDotacion>('/gh/dotacion/maestro', data),
  listarEntregasDotacion: (estado?: string) =>
    get<GhDotacionEntrega[]>(`/gh/dotacion/entregas${estado ? `?estado=${estado}` : ''}`),
  crearEntregaDotacion: (data: { candidato_id: number; sesion_o_cita_id: number; tipo_referencia: 'SESION' | 'CITA'; observaciones?: string | null }) =>
    post<GhDotacionEntrega>('/gh/dotacion/entregas', data),
  agregarDetalleEntregaDotacion: (entregaId: number, data: any) =>
    post<GhDotacionEntrega>(`/gh/dotacion/entregas/${entregaId}/detalle`, data),
  cerrarEntregaDotacion: (entregaId: number) =>
    post<GhDotacionEntrega>(`/gh/dotacion/entregas/${entregaId}/cerrar`, {}),

  // Portal de induccion
  validarPortalInduccion: (token: string) => get<GhPortalInduccionValidateResponse>(`/gh/portal/induccion/${token}`),
  checkinPortalInduccion: (token: string, data: { codigo: string }) =>
    post<GhPortalInduccionAccionResponse>(`/gh/portal/induccion/${token}/checkin`, data),
  checkoutPortalInduccion: (token: string, data: { codigo: string }) =>
    post<GhPortalInduccionAccionResponse>(`/gh/portal/induccion/${token}/checkout`, data),
}
