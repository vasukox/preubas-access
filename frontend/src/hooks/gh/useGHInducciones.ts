import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'
import type { GhSesionInduccionCreateRequest } from '@/types/gh'

export function useGHSesionesInduccion(params?: { sede_id?: number; estado_sesion?: string }) {
  return useQuery({
    queryKey: ['gh', 'inducciones', params],
    queryFn: () => ghService.listarSesionesInduccion(params),
  })
}

export function useCrearGHSesionInduccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GhSesionInduccionCreateRequest) => ghService.crearSesionInduccion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'inducciones'] })
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}

export function useGenerarCodigoCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sesionId: number) => ghService.generarCodigoCheckin(sesionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'inducciones'] })
    },
  })
}

export function useGenerarCodigoCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sesionId: number) => ghService.generarCodigoCheckout(sesionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'inducciones'] })
    },
  })
}

export function useEnviarLinksInduccion() {
  return useMutation({
    mutationFn: (sesionId: number) => ghService.enviarLinksInduccion(sesionId),
  })
}

export function useCambiarEstadoSesionInduccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { estado_sesion: string; motivo?: string } }) =>
      ghService.cambiarEstadoSesionInduccion(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'inducciones'] })
      qc.invalidateQueries({ queryKey: ['gh', 'citas'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    },
  })
}
