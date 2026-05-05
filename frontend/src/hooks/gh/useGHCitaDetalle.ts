import { useQuery } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'

export function useGHCitaDetalle(citaId: number | null) {
  return useQuery({
    queryKey: ['gh', 'cita', citaId],
    queryFn: () => ghService.getCita(citaId as number),
    enabled: Boolean(citaId),
  })
}
