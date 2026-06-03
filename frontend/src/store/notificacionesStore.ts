import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { notificacionesService } from '@/services/notificaciones.service'
import type { Notificacion } from '@/types/notificaciones'

interface NotificacionesState {
  conteo:         number
  notificaciones: Notificacion[]
  cargando:       boolean

  fetchConteo:        () => Promise<void>
  fetchNotificaciones: () => Promise<void>
  marcarLeida:        (id: number) => Promise<void>
  marcarTodas:        () => Promise<void>
}

export const useNotificacionesStore = create<NotificacionesState>()(
  devtools(
    (set, get) => ({
      conteo:         0,
      notificaciones: [],
      cargando:       false,

      fetchConteo: async () => {
        try {
          const { conteo } = await notificacionesService.getConteo()
          set({ conteo }, false, 'notificaciones/fetchConteo')
        } catch {
          // Polling silencioso — no interrumpir la UI por un error de conteo
        }
      },

      fetchNotificaciones: async () => {
        set({ cargando: true }, false, 'notificaciones/fetchNotificaciones:start')
        try {
          const resp = await notificacionesService.listar()
          set(
            { notificaciones: resp.data, cargando: false },
            false,
            'notificaciones/fetchNotificaciones:done',
          )
        } catch {
          set({ cargando: false }, false, 'notificaciones/fetchNotificaciones:error')
        }
      },

      marcarLeida: async (id) => {
        const { notificaciones } = get()
        const notif = notificaciones.find(n => n.id === id)
        if (!notif || notif.leida) return

        try {
          await notificacionesService.marcarLeida(id)
          set(
            (state) => ({
              conteo: Math.max(0, state.conteo - 1),
              notificaciones: state.notificaciones.filter(n => n.id !== id),
            }),
            false,
            'notificaciones/marcarLeida',
          )
        } catch {
          // No revertir UI — el error se ignora silenciosamente
        }
      },

      marcarTodas: async () => {
        try {
          await notificacionesService.marcarTodasLeidas()
          set(
            { conteo: 0, notificaciones: [] },
            false,
            'notificaciones/marcarTodas',
          )
        } catch {
          // No revertir UI
        }
      },
    }),
    { name: 'KOAJNotificacionesStore' },
  ),
)
