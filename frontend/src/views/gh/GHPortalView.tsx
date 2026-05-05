import { useParams } from 'react-router-dom'

import { getErrorMessage } from '@/services/api'
import {
  useGHPortal,
  useGHPortalConfirmar,
  useGHPortalReagendar,
} from '@/hooks/gh/useGHPortal'
import { PortalConfirmacionCard } from '@/views/gh/components/PortalConfirmacionCard'

export default function GHPortalView() {
  const { token } = useParams()
  const { data, isLoading } = useGHPortal(token)
  const confirmarMutation = useGHPortalConfirmar(token)
  const reagendarMutation = useGHPortalReagendar(token)

  if (!token) return <div>Token inválido.</div>
  if (isLoading) return <div>Validando token...</div>

  const isSubmitting = confirmarMutation.isPending || reagendarMutation.isPending

  const handleConfirmar = async (payload: Parameters<typeof confirmarMutation.mutateAsync>[0]) => {
    try {
      return await confirmarMutation.mutateAsync(payload)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const handleReagendar = async (payload: Parameters<typeof reagendarMutation.mutateAsync>[0]) => {
    try {
      return await reagendarMutation.mutateAsync(payload)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Portal Gestión Humana</h2>
      <PortalConfirmacionCard
        payload={data ?? null}
        onConfirmar={handleConfirmar}
        onReagendar={handleReagendar}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
