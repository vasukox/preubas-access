import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, BriefcaseBusiness, User, Mail, CreditCard, Check, X, UserX, Play, Flag, Trash2 } from 'lucide-react'

import type { GhCita } from '@/types/gh'
import { EstadoBadge } from './EstadoBadge'
import type { GhEstadoCita } from '@/types/gh'
import { ConfirmActionModal } from '@/components/feedback/ConfirmActionModal'

type EstadoAction = {
  estado: GhEstadoCita
  label: string
  tone: 'default' | 'warn' | 'danger' | 'success'
  icon: any
}

function getActionsByEstado(cita: GhCita): EstadoAction[] {
  const { estado } = cita
  const isInduccion = cita.tipo_cita === 'INDUCCION'

  if (estado === 'PROGRAMADA') {
    return [
      { estado: 'CONFIRMADA', label: 'Confirmar', tone: 'success', icon: Check },
      { estado: 'NO_ASISTIO', label: 'Inasistencia', tone: 'warn', icon: UserX },
      { estado: 'CANCELADA', label: 'Cancelar', tone: 'danger', icon: X },
    ]
  }
  if (estado === 'CONFIRMADA') {
    if (isInduccion) {
      return [
        { estado: 'NO_ASISTIO', label: 'Inasistencia', tone: 'warn', icon: UserX },
        { estado: 'CANCELADA', label: 'Cancelar', tone: 'danger', icon: X },
      ]
    }
    return [
      { estado: 'EN_CURSO', label: 'Iniciar', tone: 'default', icon: Play },
      { estado: 'NO_ASISTIO', label: 'Inasistencia', tone: 'warn', icon: UserX },
      { estado: 'CANCELADA', label: 'Cancelar', tone: 'danger', icon: X },
    ]
  }
  if (estado === 'EN_CURSO') {
    if (isInduccion) return []
    return [{ estado: 'FINALIZADA', label: 'Finalizar', tone: 'success', icon: Flag }]
  }
  return []
}

function formatTimeOnly(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatDateOnly(dateString: string) {
  return new Date(dateString).toLocaleDateString([], { day: '2-digit', month: 'short' })
}

interface CitasTableProps {
  citas: GhCita[]
  onCambiarEstado: (payload: { citaId: number; estado: GhEstadoCita; motivo?: string | null }) => Promise<void>
  onEliminarCita: (cita: GhCita) => Promise<void>
  loadingKey: string | null
}

function resolveActionColor(tone: EstadoAction['tone']) {
  if (tone === 'danger') return { base: 'var(--text-muted)', hoverBg: 'var(--danger-50)', hoverColor: 'var(--danger-600)', border: 'var(--border-subtle)' }
  if (tone === 'warn') return { base: 'var(--text-muted)', hoverBg: 'var(--warning-50)', hoverColor: 'var(--warning-600)', border: 'var(--border-subtle)' }
  if (tone === 'success') return { base: 'var(--text-muted)', hoverBg: 'var(--success-50)', hoverColor: 'var(--success-600)', border: 'var(--border-subtle)' }
  return { base: 'var(--text-muted)', hoverBg: 'var(--primary-50)', hoverColor: 'var(--primary-600)', border: 'var(--border-subtle)' }
}

function resolveHighlightColor(estado: GhEstadoCita) {
  if (estado === 'CONFIRMADA' || estado === 'FINALIZADA') return 'var(--success-50)'
  if (estado === 'NO_ASISTIO') return 'var(--warning-50)'
  if (estado === 'CANCELADA') return 'var(--danger-50)'
  if (estado === 'EN_CURSO') return 'var(--primary-50)'
  return 'transparent'
}


function CitaTableRow({
  cita,
  loadingKey,
  onActionClick,
  onDeleteClick,
}: {
  cita: GhCita
  loadingKey: string | null
  onActionClick: (action: EstadoAction) => void
  onDeleteClick: () => void
}) {
  const navigate = useNavigate()
  const actions = getActionsByEstado(cita)

  // Sistema de destello dinámico:
  const [flashColor, setFlashColor] = useState<string>('transparent')
  const [prevEstado, setPrevEstado] = useState(cita.estado)

  // Usamos useEffect para escuchar el cambio de estado y ejecutar la animación de flash.
  useEffect(() => {
    if (cita.estado !== prevEstado) {
      setFlashColor(resolveHighlightColor(cita.estado))
      setPrevEstado(cita.estado)
      const t = setTimeout(() => setFlashColor('transparent'), 1200) // Se apaga suavemente después de 1.2s
      return () => clearTimeout(t)
    }
  }, [cita.estado, prevEstado])

  return (
    <tr
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: flashColor === 'transparent' ? 'transparent' : flashColor,
        transition: 'background 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      onMouseOver={(e) => {
        if (flashColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
      }}
      onMouseOut={(e) => {
        if (flashColor === 'transparent') (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <td style={{ padding: '14px' }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', transition: flashColor !== 'transparent' ? 'transform 0.3s ease' : 'none', transform: flashColor !== 'transparent' ? 'scale(1.02)' : 'none', transformOrigin: 'left center' }}>
          {cita.candidato.nombres} {cita.candidato.apellidos}
        </div>
        <div style={{ display: 'grid', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <CreditCard size={12} /> {cita.candidato.tipo_documento} {cita.candidato.numero_documento}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <Mail size={12} /> {cita.candidato.email ?? 'Sin correo electrónico'}
          </div>
        </div>
      </td>

      <td style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Clock size={14} color="var(--primary-500)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatTimeOnly(cita.fecha_hora_inicio)} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>→</span> {formatTimeOnly(cita.fecha_hora_fin)}
          </span>
        </div>
        <div style={{ paddingLeft: '20px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {formatDateOnly(cita.fecha_hora_inicio)}
        </div>
      </td>

      <td style={{ padding: '14px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
            <BriefcaseBusiness size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {cita.tipo_cita.replace('_', ' ').toLowerCase()}
            </span>
          </div>
          {cita.sesion_induccion ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--info-400)', background: 'var(--info-50)', color: 'var(--info-600)', fontSize: '0.72rem', fontWeight: 600 }}>
              Sesion #{cita.sesion_induccion.sesion_id} {cita.sesion_induccion.estado_sesion.replace('_', ' ')}
            </div>
          ) : null}
        </div>
      </td>

      <td style={{ padding: '14px' }}>
        <div style={{ transition: flashColor !== 'transparent' ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none', transform: flashColor !== 'transparent' ? 'scale(1.1)' : 'none' }}>
           <EstadoBadge estado={cita.estado} />
        </div>
      </td>

      <td style={{ padding: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            onClick={() => navigate(`/gh/citas/${cita.id}`)}
            style={{
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Ver perfil
          </button>

          {cita.tipo_cita === 'INDUCCION' ? (
            <button
              type="button"
              onClick={() => navigate('/gh/inducciones')}
              style={{
                border: '1px solid var(--info-400)',
                color: 'var(--info-600)',
                background: 'var(--info-50)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cita.sesion_induccion ? 'Gestionar en inducciones' : 'Crear sesion'}
            </button>
          ) : null}

          {actions.map((action) => {
            const styleData = resolveActionColor(action.tone)
            const actionKey = `${cita.id}:${action.estado}`
            const isLoading = loadingKey === actionKey
            const Icon = action.icon
            return (
              <button
                key={action.estado}
                type="button"
                disabled={Boolean(loadingKey)}
                onClick={() => onActionClick(action)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = styleData.hoverBg
                  e.currentTarget.style.color = styleData.hoverColor
                  e.currentTarget.style.borderColor = styleData.hoverColor
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = styleData.base
                  e.currentTarget.style.borderColor = styleData.border
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: `1px solid ${styleData.border}`,
                  color: styleData.base,
                  background: 'transparent',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: Boolean(loadingKey) ? 'not-allowed' : 'pointer',
                  opacity: Boolean(loadingKey) ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isLoading ? (
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <Icon size={13} strokeWidth={2.5} />
                )}
                {action.label}
              </button>
            )
          })}
          <button
            type="button"
            disabled={Boolean(loadingKey)}
            onClick={onDeleteClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--danger-600)',
              background: 'transparent',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: Boolean(loadingKey) ? 'not-allowed' : 'pointer',
              opacity: Boolean(loadingKey) ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Trash2 size={13} strokeWidth={2.5} />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  )
}

export function CitasTable({ citas, onCambiarEstado, onEliminarCita, loadingKey }: CitasTableProps) {
  const [actionState, setActionState] = useState<{ cita: GhCita; action: EstadoAction } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GhCita | null>(null)
  const [motivo, setMotivo] = useState('')

  if (citas.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <User size={32} color="var(--border-subtle)" style={{ marginBottom: '12px', display: 'inline-block' }} />
        <div>No hay citas agendadas que coincidan con la búsqueda.</div>
      </div>
    )
  }

  const requiresMotivo = actionState?.action.estado === 'NO_ASISTIO' || actionState?.action.estado === 'CANCELADA'

  const handleConfirmAction = async () => {
    if (!actionState) return
    await onCambiarEstado({
      citaId: actionState.cita.id,
      estado: actionState.action.estado,
      motivo: requiresMotivo ? motivo.trim() || null : null,
    })
    setActionState(null)
    setMotivo('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await onEliminarCita(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <>
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>CANDIDATO / VISITANTE</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>HORARIO ASIGNADO</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>MOTIVO GH</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ESTADO ACTUAL</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>GESTIÓN</th>
              </tr>
            </thead>

            <tbody>
              {citas.map((cita) => (
                 <CitaTableRow
                   key={cita.id}
                   cita={cita}
                   loadingKey={loadingKey}
                   onActionClick={(action) => {
                     setMotivo('')
                     setActionState({ cita, action })
                   }}
                   onDeleteClick={() => {
                     setMotivo('')
                     setDeleteTarget(cita)
                   }}
                 />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(actionState)}
        title={actionState ? `${actionState.action.label} cita ${actionState.cita.codigo}` : 'Confirmar acción'}
        message="Esta acción actualiza el estado de la cita."
        confirmLabel={actionState?.action.label ?? 'Confirmar'}
        tone={actionState?.action.tone === 'danger' ? 'danger' : 'primary'}
        loading={Boolean(loadingKey)}
        onCancel={() => {
          if (loadingKey) return
          setActionState(null)
          setMotivo('')
        }}
        onConfirm={() => {
          void handleConfirmAction()
        }}
      >
        {requiresMotivo ? (
          <label style={{ display: 'grid', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Motivo (opcional)</span>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Razones de la inasistencia o cancelación..."
              style={{ resize: 'vertical', width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
            />
          </label>
        ) : null}
      </ConfirmActionModal>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Eliminar cita ${deleteTarget.codigo}` : 'Eliminar cita'}
        message={
          deleteTarget?.tipo_cita === 'INDUCCION'
            ? 'Esta accion eliminara la cita y desactivara sus links de autogestion. Si la cita ya esta ligada a una sesion de induccion, el sistema la bloqueara para proteger la relacion operativa.'
            : 'Esta accion eliminara la cita y desactivara sus links de autogestion asociados.'
        }
        confirmLabel="Eliminar cita"
        tone="danger"
        loading={Boolean(loadingKey)}
        onCancel={() => {
          if (loadingKey) return
          setDeleteTarget(null)
        }}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
      />
    </>
  )
}

