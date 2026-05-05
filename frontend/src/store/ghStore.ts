import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface GHUIState {
  selectedCitaId: number | null
  activeEstadoFilter: string | null
  activeTipoCitaFilter: string | null
  busquedaFilter: string
  fechaDesdeFilter: string
  fechaHastaFilter: string
  page: number
  perPage: number
  setSelectedCitaId: (id: number | null) => void
  setActiveEstadoFilter: (estado: string | null) => void
  setActiveTipoCitaFilter: (tipo: string | null) => void
  setBusquedaFilter: (busqueda: string) => void
  setFechaDesdeFilter: (fecha: string) => void
  setFechaHastaFilter: (fecha: string) => void
  setPagination: (page: number, perPage: number) => void
  resetFilters: () => void
}

export const useGHStore = create<GHUIState>()(
  devtools(
    (set) => ({
      selectedCitaId: null,
      activeEstadoFilter: null,
      activeTipoCitaFilter: null,
      busquedaFilter: '',
      fechaDesdeFilter: '',
      fechaHastaFilter: '',
      page: 1,
      perPage: 20,

      setSelectedCitaId: (id) => set({ selectedCitaId: id }, false, 'gh/setSelectedCitaId'),
      setActiveEstadoFilter: (estado) => set({ activeEstadoFilter: estado, page: 1 }, false, 'gh/setActiveEstadoFilter'),
      setActiveTipoCitaFilter: (tipo) => set({ activeTipoCitaFilter: tipo, page: 1 }, false, 'gh/setActiveTipoCitaFilter'),
      setBusquedaFilter: (busqueda) => set({ busquedaFilter: busqueda, page: 1 }, false, 'gh/setBusquedaFilter'),
      setFechaDesdeFilter: (fecha) => set({ fechaDesdeFilter: fecha, page: 1 }, false, 'gh/setFechaDesdeFilter'),
      setFechaHastaFilter: (fecha) => set({ fechaHastaFilter: fecha, page: 1 }, false, 'gh/setFechaHastaFilter'),
      setPagination: (page, perPage) => set({ page, perPage }, false, 'gh/setPagination'),
      resetFilters: () =>
        set(
          {
            activeEstadoFilter: null,
            activeTipoCitaFilter: null,
            busquedaFilter: '',
            fechaDesdeFilter: '',
            fechaHastaFilter: '',
            page: 1,
          },
          false,
          'gh/resetFilters',
        ),
    }),
    { name: 'KOAJGHStore' },
  ),
)
