import { useParams } from 'react-router-dom'
import { useState } from 'react'

import { getErrorMessage } from '@/services/api'
import {
  useGHPortalInduccion,
  useGHPortalInduccionCheckin,
  useGHPortalInduccionCheckout,
} from '@/hooks/gh/useGHPortal'

export default function GHPortalInduccionView() {
  const { token } = useParams()
  const { data, isLoading } = useGHPortalInduccion(token)
  const checkinMutation = useGHPortalInduccionCheckin(token)
  const checkoutMutation = useGHPortalInduccionCheckout(token)

  if (!token) return <div>Token inválido.</div>
  if (isLoading) return <div>Validando token...</div>

  const isSubmitting = checkinMutation.isPending || checkoutMutation.isPending

  // Link habilitado y pendiente: solicitar check-in
  if (data?.ventana_habilitada && data.estado_asistencia === 'PENDIENTE') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16, padding: 20 }}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>Check-in de Inducción</h2>
        <div style={{
          padding: 24,
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12
        }}>
          <p style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
            Ingresa el código de entrada proporcionado por el administrador:
          </p>
          <CheckinForm
            onSubmit={async (codigo) => {
              try {
                await checkinMutation.mutateAsync({ codigo })
              } catch (error) {
                throw new Error(getErrorMessage(error))
              }
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )
  }

  // Ya hizo check-in: solicitar check-out
  if (data?.estado_asistencia === 'EN_SESION') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16, padding: 20 }}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>Check-out de Inducción</h2>
        <div style={{
          padding: 24,
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          borderRadius: 12
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ margin: 0, color: 'var(--success-700)' }}>
              ¡Check-in exitoso! Estás participando en la sesión de inducción.
            </p>
          </div>
          <p style={{ margin: '16px 0', textAlign: 'center' }}>
            Cuando termine la sesión, ingresa el código de salida proporcionado por el administrador:
          </p>
          <CheckoutForm
            onSubmit={async (codigo) => {
              try {
                await checkoutMutation.mutateAsync({ codigo })
              } catch (error) {
                throw new Error(getErrorMessage(error))
              }
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )
  }

  // Flujo completo
  if (data?.estado_asistencia === 'CHECKOUT_OK') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16, padding: 20 }}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>¡Inducción Completada!</h2>
        <div style={{
          padding: 24,
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--success-700)' }}>
            ¡Felicitaciones!
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Has completado exitosamente tu sesión de inducción.
          </p>
        </div>
      </div>
    )
  }

  // Estado no habilitado o fuera de ventana
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16, padding: 20 }}>
      <h2 style={{ margin: 0, textAlign: 'center' }}>Portal de Inducción</h2>
      <div style={{
        padding: 24,
        background: 'var(--bg-base)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>⌛</div>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Link aún no habilitado
        </h3>
        <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
          Tu sesión se encuentra en estado: <strong>{data?.estado_sesion ?? 'DESCONOCIDO'}</strong>
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Sesión #{data?.sesion_id ?? '-'} · Estado de asistencia: {data?.estado_asistencia ?? '-'}.
        </p>
      </div>
    </div>
  )
}

function CheckinForm({
  onSubmit,
  isSubmitting
}: {
  onSubmit: (codigo: string) => Promise<void>
  isSubmitting: boolean
}) {
  const [codigo, setCodigo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(codigo)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <input
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Ingresa el código de entrada"
        required
        style={{
          padding: '12px',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          fontSize: 16,
          textAlign: 'center',
          fontFamily: 'monospace'
        }}
      />
      <button
        type="submit"
        disabled={isSubmitting || !codigo.trim()}
        style={{
          padding: '12px 24px',
          background: 'var(--primary-500)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.6 : 1
        }}
      >
        {isSubmitting ? 'Validando...' : 'Hacer Check-in'}
      </button>
    </form>
  )
}

function CheckoutForm({
  onSubmit,
  isSubmitting
}: {
  onSubmit: (codigo: string) => Promise<void>
  isSubmitting: boolean
}) {
  const [codigo, setCodigo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(codigo)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <input
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Ingresa el código de salida"
        required
        style={{
          padding: '12px',
          border: '1px solid var(--border-default)',
          borderRadius: 6,
          fontSize: 16,
          textAlign: 'center',
          fontFamily: 'monospace'
        }}
      />
      <button
        type="submit"
        disabled={isSubmitting || !codigo.trim()}
        style={{
          padding: '12px 24px',
          background: 'var(--primary-500)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.6 : 1
        }}
      >
        {isSubmitting ? 'Validando...' : 'Hacer Check-out'}
      </button>
    </form>
  )
}
