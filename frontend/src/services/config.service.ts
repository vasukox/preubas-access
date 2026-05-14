import { del, get, post, put } from './api'

export type CatalogoTipo = 'eps' | 'arl' | 'afp'

export interface GlobalParams {
  access_token_expire_minutes: number
  refresh_token_expire_days: number
  max_upload_size_mb: number
  allowed_origins: string[]
  debug: boolean
  environment: string
}

export interface UbicacionConfig {
  id: number
  sede_id: number
  nombre: string
  codigo: string | null
  tipo: string
  activa: boolean
  descripcion: string | null
}

export interface SedeConfig {
  id: number
  nombre: string
  codigo: string
  ciudad: string
  direccion: string | null
  telefono: string | null
  activa: boolean
  capacidad_carros: number
  capacidad_motos: number
  capacidad_bicis: number
  aplica_pico_placa: boolean
  notas: string | null
  ubicaciones: UbicacionConfig[]
}

export interface CatalogoItem {
  id: number
  nombre: string
  codigo: string
  activa: boolean
}

export interface NormaConfig {
  id: number
  numero: number
  titulo: string
  contenido: string
  activa: boolean
  sede_id: number | null
}

export type TipoContratistaConfig = 'NORMAL' | 'ALTO_RIESGO' | 'EXCEPCION'

export interface TiemposContratista {
  id: number
  tipo_contratista: TipoContratistaConfig
  token_duracion_horas: number
  autorizacion_duracion_dias: number
  alerta_vencimiento_dias: number
  requiere_examen_medico: boolean
  requiere_seguridad_social: boolean
}

export const configService = {
  getSistema: () => get<GlobalParams>('/config/sistema'),

  listSedes: () => get<SedeConfig[]>('/config/sedes'),
  createSede: (data: { nombre: string; ciudad: string }) =>
    post<SedeConfig>('/config/sedes', data),
  updateSede: (id: number, data: Partial<{ nombre: string; codigo: string; ciudad: string; activa: boolean }>) =>
    put<SedeConfig>(`/config/sedes/${id}`, data),

  listUbicaciones: (sedeId?: number) =>
    get<UbicacionConfig[]>(`/config/ubicaciones${sedeId ? `?sede_id=${sedeId}` : ''}`),
  createUbicacion: (data: { sede_id: number; nombre: string; codigo?: string; tipo?: string; descripcion?: string }) =>
    post<UbicacionConfig>('/config/ubicaciones', data),
  updateUbicacion: (id: number, data: Partial<{ nombre: string; codigo: string; tipo: string }>) =>
    put<UbicacionConfig>(`/config/ubicaciones/${id}`, data),

  listCatalogo: (tipo: CatalogoTipo) => get<CatalogoItem[]>(`/config/catalogos/${tipo}`),
  createCatalogoItem: (tipo: CatalogoTipo, data: { nombre: string; codigo: string; activa?: boolean }) =>
    post<CatalogoItem>(`/config/catalogos/${tipo}`, data),
  deleteCatalogoItem: (tipo: CatalogoTipo, id: number) => del<null>(`/config/catalogos/${tipo}/${id}`),

  listNormas: (sedeId?: number) =>
    get<NormaConfig[]>(`/config/normas${sedeId ? `?sede_id=${sedeId}` : ''}`),
  createNorma: (data: { numero: number; titulo: string; contenido: string; activa?: boolean; sede_id?: number | null }) =>
    post<NormaConfig>('/config/normas', data),
  updateNorma: (id: number, data: Partial<{ numero: number; titulo: string; contenido: string; activa: boolean; sede_id: number | null }>) =>
    put<NormaConfig>(`/config/normas/${id}`, data),
  deleteNorma: (id: number) => del<null>(`/config/normas/${id}`),

  listTiemposContratista: () =>
    get<TiemposContratista[]>('/config/tiempos-contratista'),
  updateTiemposContratista: (tipo: TipoContratistaConfig, data: Partial<Omit<TiemposContratista, 'id' | 'tipo_contratista'>>) =>
    put<TiemposContratista>(`/config/tiempos-contratista/${tipo}`, data),
}
