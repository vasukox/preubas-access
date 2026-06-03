import { get, patch } from './api'
import type { Notificacion, NotificacionesListResponse } from '@/types/notificaciones'

export const notificacionesService = {
  getConteo: () =>
    get<{ conteo: number }>('/notificaciones/conteo'),

  listar: (page = 1, limit = 20) =>
    get<NotificacionesListResponse>(`/notificaciones?page=${page}&limit=${limit}`),

  marcarLeida: (id: number) =>
    patch<{ success: boolean }>(`/notificaciones/${id}/leer`),

  marcarTodasLeidas: () =>
    patch<{ success: boolean }>('/notificaciones/leer-todas'),
}

export type { Notificacion, NotificacionesListResponse }
