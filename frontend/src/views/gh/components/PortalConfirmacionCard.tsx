import { useMemo, useState } from 'react'

import type {
  GhPortalAccionResponse,
  GhPortalConfirmRequest,
  GhPortalReagendarRequest,
  GhPortalValidateResponse,
} from '@/types/gh'

interface PortalConfirmacionCardProps {
  payload: GhPortalValidateResponse | null
  onConfirmar: (request: GhPortalConfirmRequest) => Promise<GhPortalAccionResponse>
  onReagendar: (request: GhPortalReagendarRequest) => Promise<GhPortalAccionResponse>
  isSubmitting: boolean
}

export function PortalConfirmacionCard({
  payload,
  onConfirmar,
  onReagendar,
  isSubmitting,
}: PortalConfirmacionCardProps) {
  const [comentario, setComentario] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const cita = payload?.cita ?? null

  const citasTimes = useMemo(() => {
    if (!cita) {
      return { inicioLocal: '', finLocal: '' }
    }
    return {
      inicioLocal: new Date(cita.fecha_hora_inicio).toLocaleString(),
      finLocal: new Date(cita.fecha_hora_fin).toLocaleString(),
    }
  }, [cita])

  if (!payload || !cita) {
    return (
      <section style={{ border: '1px solid var(--border-default)', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Confirmación de cita</h3>
        <p style={{ margin: 0 }}>No fue posible cargar la información de la cita.</p>
      </section>
    )
  }

  const handleConfirmar = async (confirmada: boolean) => {
    setStatusMsg(null)
    try {
      const response = await onConfirmar({ confirmada, comentario: comentario || null })
      setStatusMsg(`Acción aplicada: ${response.accion}. Estado actual: ${response.cita.estado}.`)
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'No fue posible aplicar la acción.')
    }
  }

  const handleReagendar = async () => {
    setStatusMsg(null)
    if (!inicio || !fin) {
      setStatusMsg('Debes seleccionar fecha y hora de inicio y fin para reagendar.')
      return
    }

    try {
      const response = await onReagendar({
        fecha_hora_inicio: new Date(inicio).toISOString(),
        fecha_hora_fin: new Date(fin).toISOString(),
        comentario: comentario || null,
      })
      setStatusMsg(`Acción aplicada: ${response.accion}. Nueva fecha registrada correctamente.`)
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'No fue posible reagendar la cita.')
    }
  }

  return (
    <section style={{ border: '1px solid var(--border-default)', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Confirmación de cita</h3>

      <div style={{ display: 'grid', gap: 4 }}>
        <div><strong>Código:</strong> {cita.codigo}</div>
        <div><strong>Candidato:</strong> {cita.candidato.nombres} {cita.candidato.apellidos}</div>
        <div><strong>Tipo:</strong> {cita.tipo_cita}</div>
        <div><strong>Estado:</strong> {cita.estado}</div>
        <div><strong>Inicio:</strong> {citasTimes.inicioLocal}</div>
        <div><strong>Fin:</strong> {citasTimes.finLocal}</div>
      </div>

      <label style={{ display: 'grid', gap: 6 }}>
        <span>Comentario (opcional)</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: 8 }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" disabled={isSubmitting} onClick={() => handleConfirmar(true)}>
          Confirmar asistencia
        </button>
        <button type="button" disabled={isSubmitting} onClick={() => handleConfirmar(false)}>
          Cancelar cita
        </button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <strong>Reagendar</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Nuevo inicio</span>
            <input
              type="datetime-local"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: 8 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Nuevo fin</span>
            <input
              type="datetime-local"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              style={{ border: '1px solid var(--border-default)', borderRadius: 8, padding: 8 }}
            />
          </label>
        </div>
        <button type="button" disabled={isSubmitting} onClick={handleReagendar}>
          Enviar reagendamiento
        </button>
      </div>

      {statusMsg ? <div style={{ color: 'var(--text-secondary)' }}>{statusMsg}</div> : null}
    </section>
  )
}
