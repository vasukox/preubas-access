/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store de sede activa.
 *
 * Responsabilidades:
 * - Mantener la sede seleccionada por el usuario
 * - Proveer la lista de sedes disponibles según sus roles
 * - Persistir la sede activa en localStorage
 *
 * Patrón:
 *   Todos los endpoints que necesitan sede_id la leen desde aquí.
 *   El Topbar usa este store para el selector de sede.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { SedeBasica } from '@/types'

interface SedeState {
  // ── Estado ──────────────────────────────────────────────────────
  sedeActiva:  SedeBasica | null
  sedes:       SedeBasica[]
  isLoading:   boolean

  // ── Acciones ─────────────────────────────────────────────────────
  setSedeActiva: (sede: SedeBasica) => void
  setSedes:      (sedes: SedeBasica[]) => void
  setLoading:    (loading: boolean) => void
  clearSede:     () => void
}

export const useSedeStore = create<SedeState>()(
  devtools(
    persist(
      (set) => ({
        // ── Estado inicial ───────────────────────────────────────
        sedeActiva: null,
        sedes:      [],
        isLoading:  false,

        // ── Acciones ─────────────────────────────────────────────
        setSedeActiva: (sedeActiva) =>
          set({ sedeActiva }, false, 'sede/setSedeActiva'),

        setSedes: (sedes) =>
          set({ sedes }, false, 'sede/setSedes'),

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'sede/setLoading'),

        clearSede: () =>
          set({ sedeActiva: null, sedes: [] }, false, 'sede/clearSede'),
      }),
      {
        name: 'koaj-sede-store',
        // Solo persistir la sede activa, no la lista completa
        partialize: (state) => ({ sedeActiva: state.sedeActiva }),
      },
    ),
    { name: 'KOAJSedeStore' },
  ),
)