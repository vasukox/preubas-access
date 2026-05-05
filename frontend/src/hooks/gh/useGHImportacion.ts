import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'
import type { GhImportacionCreateRequest } from '@/types/gh'

export function useGHImportacion() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: GhImportacionCreateRequest) => ghService.crearImportacion(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['gh', 'importacion', created.id] })
    },
  })
}

export function useGHImportacionDetalle(importacionId: number | null) {
  return useQuery({
    queryKey: ['gh', 'importacion', importacionId],
    queryFn: () => ghService.getImportacion(importacionId as number),
    enabled: Boolean(importacionId),
    refetchInterval: 4000,
  })
}
