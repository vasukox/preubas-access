import { useMutation, useQuery } from '@tanstack/react-query'

import { ghService } from '@/services/gh.service'
import type { GhPortalConfirmRequest, GhPortalReagendarRequest } from '@/types/gh'

export function useGHPortal(token: string | undefined) {
  return useQuery({
    queryKey: ['gh', 'portal', token],
    queryFn: () => ghService.validarPortal(token as string),
    enabled: Boolean(token),
  })
}

export function useGHPortalConfirmar(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: GhPortalConfirmRequest) => ghService.confirmarPortal(token as string, payload),
  })
}

export function useGHPortalReagendar(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: GhPortalReagendarRequest) => ghService.reagendarPortal(token as string, payload),
  })
}

// Nuevos hooks para el portal de inducción
export function useGHPortalInduccion(token: string | undefined) {
  return useQuery({
    queryKey: ['gh', 'portal', 'induccion', token],
    queryFn: () => ghService.validarPortalInduccion(token as string),
    enabled: Boolean(token),
  })
}

export function useGHPortalInduccionCheckin(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: { codigo: string }) => ghService.checkinPortalInduccion(token as string, payload),
  })
}

export function useGHPortalInduccionCheckout(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: { codigo: string }) => ghService.checkoutPortalInduccion(token as string, payload),
  })
}
