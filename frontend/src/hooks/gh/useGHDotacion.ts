import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'

export function useGHMaestroDotacion(params?: {
  sede_id?: number
  area?: string
  cargo?: string
  tipo_contrato?: string
  activos_only?: boolean
}) {
  return useQuery({
    queryKey: ['gh', 'dotacion', 'maestro', params],
    queryFn: () => ghService.listarMaestroDotacion(params),
  })
}

export function useCrearGHMaestroDotacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ghService.crearMaestroDotacion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'dotacion', 'maestro'] })
    },
  })
}

export function useGHEntregasDotacion(estado?: string) {
  return useQuery({
    queryKey: ['gh', 'dotacion', 'entregas', estado],
    queryFn: () => ghService.listarEntregasDotacion(estado),
  })
}

export function useCrearGHEntregaDotacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { candidato_id: number; sesion_o_cita_id: number; tipo_referencia: 'SESION' | 'CITA'; observaciones?: string | null }) =>
      ghService.crearEntregaDotacion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'dotacion', 'entregas'] })
    },
  })
}

export function useAgregarDetalleEntregaDotacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      ghService.agregarDetalleEntregaDotacion(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'dotacion', 'entregas'] })
    },
  })
}

export function useCerrarEntregaDotacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ghService.cerrarEntregaDotacion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gh', 'dotacion', 'entregas'] })
    },
  })
}
