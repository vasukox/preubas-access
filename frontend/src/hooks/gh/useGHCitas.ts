import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'
import type {
  GhCitaCreateRequest,
  GhCitaEstadoRequest,
  GhCitaGrupoCreateRequest,
  GhCitaUpdateRequest,
  GhTipoCita,
} from '@/types/gh'

export function useGHCitas(params: {
  sede_id: number
  estado?: string
  tipo_cita?: GhTipoCita
  busqueda?: string
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ['gh', 'citas', params],
    queryFn: () => ghService.listarCitas(params),
    enabled: Boolean(params.sede_id),
    placeholderData: keepPreviousData,
  })
}

export function useCrearGHCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GhCitaCreateRequest) => ghService.crearCita(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}

export function useCrearGHCitasGrupo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GhCitaGrupoCreateRequest) => ghService.crearCitasGrupo(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}

export function useActualizarGHCita(citaId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GhCitaUpdateRequest) => ghService.actualizarCita(citaId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'cita', citaId] })
    },
  })
}

export function useCambiarEstadoGHCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { citaId: number; body: GhCitaEstadoRequest }) =>
      ghService.cambiarEstadoCita(payload.citaId, payload.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}

export function useEliminarGHCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (citaId: number) => ghService.eliminarCita(citaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}
