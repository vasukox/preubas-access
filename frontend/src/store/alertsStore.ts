/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store de alertas y notificaciones del sistema.
 *
 * Responsabilidades:
 * - Mantener el contador de alertas no leídas
 * - Guardar las alertas recibidas por WebSocket
 * - Marcar alertas como leídas
 *
 * Patrón:
 *   El Topbar muestra el badge con alertas no leídas.
 *   El panel de alertas lista y gestiona las alertas.
 *   El wsStore alimenta este store via subscribe().
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type AlertaSeveridad = 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS'

export interface Alerta {
  id:         string
  tipo:       string
  titulo:     string
  mensaje:    string
  severidad:  AlertaSeveridad
  sede_id?:   number
  leida:      boolean
  created_at: string
  metadata?:  Record<string, unknown>
}

interface AlertsState {
  // ── Estado ──────────────────────────────────────────────────────
  alertas:      Alerta[]
  noLeidas:     number

  // ── Acciones ─────────────────────────────────────────────────────
  addAlerta:     (alerta: Omit<Alerta, 'id' | 'leida' | 'created_at'>) => void
  marcarLeida:   (id: string) => void
  marcarTodas:   () => void
  clearAlertas:  () => void
}

export const useAlertsStore = create<AlertsState>()(
  devtools(
    (set, get) => ({
      // ── Estado inicial ─────────────────────────────────────────
      alertas:  [],
      noLeidas: 0,

      // ── Acciones ───────────────────────────────────────────────
      addAlerta: (alerta) => {
        const nueva: Alerta = {
          ...alerta,
          id:         crypto.randomUUID(),
          leida:      false,
          created_at: new Date().toISOString(),
        }
        set(
          (state) => ({
            alertas:  [nueva, ...state.alertas].slice(0, 100), // Máx 100 alertas
            noLeidas: state.noLeidas + 1,
          }),
          false,
          'alerts/addAlerta',
        )
      },

      marcarLeida: (id) => {
        const { alertas } = get()
        const alerta = alertas.find((a) => a.id === id)
        if (!alerta || alerta.leida) return

        set(
          (state) => ({
            alertas:  state.alertas.map((a) =>
              a.id === id ? { ...a, leida: true } : a,
            ),
            noLeidas: Math.max(0, state.noLeidas - 1),
          }),
          false,
          'alerts/marcarLeida',
        )
      },

      marcarTodas: () => {
        set(
          (state) => ({
            alertas:  state.alertas.map((a) => ({ ...a, leida: true })),
            noLeidas: 0,
          }),
          false,
          'alerts/marcarTodas',
        )
      },

      clearAlertas: () =>
        set({ alertas: [], noLeidas: 0 }, false, 'alerts/clearAlertas'),
    }),
    { name: 'KOAJAlertsStore' },
  ),
)