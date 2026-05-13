import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Flag,
  Hash,
  Info,
  Mail,
  Phone,
  Play,
  RefreshCw,
  Shirt,
  Trash2,
  User,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { useGHCitaDetalle } from '@/hooks/gh/useGHCitaDetalle'
import { useCambiarEstadoGHCita, useEliminarGHCita } from '@/hooks/gh/useGHCitas'
import type { GhCita, GhEstadoCita, GhTipoCita } from '@/types/gh'
import { ChecklistPanel } from './components/ChecklistPanel'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ESTADO_META: Record<GhEstadoCita, { label: string; color: string; bg: string; border: string }> = {
  PROGRAMADA:  { label: 'Programada',  color: '#6366f1', bg: 'rgba(86,104,184,0.08)',  border: 'rgba(86,104,184,0.25)' },
  CONFIRMADA:  { label: 'Confirmada',  color: '#10b981', bg: 'rgba(40,149,108,0.08)',  border: 'rgba(40,149,108,0.25)' },
  EN_CURSO:    { label: 'En curso',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)',  border: 'rgba(14,165,233,0.25)' },
  FINALIZADA:  { label: 'Finalizada',  color: '#10b981', bg: 'rgba(40,149,108,0.08)',  border: 'rgba(40,149,108,0.25)' },
  NO_ASISTIO:  { label: 'No asistió',  color: '#f59e0b', bg: 'rgba(69,116,196,0.08)', border: 'rgba(69,116,196,0.25)' },
  CANCELADA:   { label: 'Cancelada',   color: '#ef4444', bg: 'rgba(192,80,80,0.08)',   border: 'rgba(192,80,80,0.25)' },
}

const TIPO_META: Record<GhTipoCita, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  INDUCCION:        { label: 'Inducción',          color: '#6366f1', bg: 'rgba(86,104,184,0.08)', border: 'rgba(86,104,184,0.2)',  Icon: UserCheck },
  FIRMA_CONTRATO:   { label: 'Firma de contrato',  color: '#10b981', bg: 'rgba(40,149,108,0.08)', border: 'rgba(40,149,108,0.2)',  Icon: Check },
  ENTREGA_DOTACION: { label: 'Entrega de dotación',color: '#f59e0b', bg: 'rgba(69,116,196,0.08)', border: 'rgba(69,116,196,0.2)', Icon: Shirt },
}

type ActionDef = {
  estado: GhEstadoCita
  label: string
  color: string
  bg: string
  border: string
  Icon: any
}

function getActions(cita: GhCita): ActionDef[] {
  const isInduccion = cita.tipo_cita === 'INDUCCION'
  if (cita.estado === 'PROGRAMADA') return [
    { estado: 'CONFIRMADA', label: 'Confirmar',    color: '#10b981', bg: 'rgba(40,149,108,0.08)', border: 'rgba(40,149,108,0.3)',  Icon: CalendarCheck2 },
    { estado: 'NO_ASISTIO', label: 'Inasistencia', color: '#f59e0b', bg: 'rgba(69,116,196,0.08)', border: 'rgba(69,116,196,0.3)', Icon: UserX },
    { estado: 'CANCELADA',  label: 'Cancelar',     color: '#ef4444', bg: 'rgba(192,80,80,0.08)',  border: 'rgba(192,80,80,0.3)',   Icon: X },
  ]
  if (cita.estado === 'CONFIRMADA') {
    const base: ActionDef[] = [
      { estado: 'NO_ASISTIO', label: 'Inasistencia', color: '#f59e0b', bg: 'rgba(69,116,196,0.08)', border: 'rgba(69,116,196,0.3)', Icon: UserX },
      { estado: 'CANCELADA',  label: 'Cancelar',     color: '#ef4444', bg: 'rgba(192,80,80,0.08)',  border: 'rgba(192,80,80,0.3)',   Icon: X },
    ]
    if (!isInduccion) base.unshift({ estado: 'EN_CURSO', label: 'Iniciar', color: '#6366f1', bg: 'rgba(86,104,184,0.08)', border: 'rgba(86,104,184,0.3)', Icon: Play })
    return base
  }
  if (cita.estado === 'EN_CURSO' && !isInduccion) return [
    { estado: 'FINALIZADA', label: 'Finalizar', color: '#10b981', bg: 'rgba(40,149,108,0.08)', border: 'rgba(40,149,108,0.3)', Icon: Flag },
  ]
  return []
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(nombres: string, apellidos: string) {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
}

// ─── EstadoBadge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: GhEstadoCita }) {
  const m = ESTADO_META[estado] ?? ESTADO_META.PROGRAMADA
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: `1px solid ${m.border}`, background: m.bg, color: m.color, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color }} />
      {m.label.toUpperCase()}
    </span>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function GHCitaDetalleView() {
  const { id } = useParams()
  const citaId = id ? Number(id) : null
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cita, isLoading, refetch, isFetching } = useGHCitaDetalle(citaId)
  const cambiarEstado = useCambiarEstadoGHCita()
  const eliminarCita = useEliminarGHCita()

  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!citaId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        ID de cita no válido.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Cargando detalle...
      </div>
    )
  }

  if (!cita) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <Info size={32} color="var(--border-subtle)" style={{ marginBottom: '12px', display: 'inline-block' }} />
        <div>No se encontró la cita #{citaId}.</div>
        <button type="button" className="btn-ghost" style={{ marginTop: '16px' }} onClick={() => navigate('/gh/citas')}>
          <ArrowLeft size={14} /> Volver a citas
        </button>
      </div>
    )
  }

  const estadoMeta = ESTADO_META[cita.estado] ?? ESTADO_META.PROGRAMADA
  const tipoMeta = TIPO_META[cita.tipo_cita]
  const actions = getActions(cita)
  const isClosed = ['FINALIZADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado)

  const handleCambiarEstado = async (action: ActionDef) => {
    setActionLoading(true)
    try {
      await cambiarEstado.mutateAsync({ citaId: cita.id, body: { estado: action.estado } })
      await queryClient.invalidateQueries({ queryKey: ['gh', 'cita', cita.id] })
      await refetch()
      toast.success(`Estado actualizado: ${action.label}`)
    } catch {
      toast.error('No se pudo actualizar el estado.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEliminar = async () => {
    setActionLoading(true)
    try {
      await eliminarCita.mutateAsync(cita.id)
      toast.success('Cita eliminada.')
      navigate('/gh/citas')
    } catch {
      toast.error('No se pudo eliminar la cita.')
      setActionLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* ── Back + breadcrumb ── */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => navigate('/gh/citas')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}
        >
          <ArrowLeft size={13} /> Agendar citas
        </button>
        <ChevronRight size={14} color="var(--text-muted)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{cita.codigo}</span>
      </div>

      {/* ── Header ── */}
      <div className="animate-fade-up stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: estadoMeta.color, boxShadow: `0 0 6px ${estadoMeta.color}` }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: estadoMeta.color, letterSpacing: '0.12em' }}>MÓDULO GH — PERFIL DE CITA</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {cita.candidato.nombres} {cita.candidato.apellidos}
          </h2>
          <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <EstadoBadge estado={cita.estado} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${tipoMeta.border}`, background: tipoMeta.bg, color: tipoMeta.color, fontSize: '0.7rem', fontWeight: 700 }}>
              <tipoMeta.Icon size={11} />
              {tipoMeta.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              #{cita.codigo}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Sync
            </div>
          )}
          <button type="button" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }} onClick={() => void refetch()}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Main grid: candidate + appointment ── */}
      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

        {/* Candidate card */}
        <div style={{ padding: '20px 22px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', display: 'grid', gap: '16px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Candidato / Visitante</div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${estadoMeta.color}20, ${estadoMeta.color}40)`, border: `2px solid ${estadoMeta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: estadoMeta.color, flexShrink: 0 }}>
              {initials(cita.candidato.nombres, cita.candidato.apellidos)}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cita.candidato.nombres} {cita.candidato.apellidos}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>ID: {cita.candidato.id}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <CreditCard size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>{cita.candidato.tipo_documento}</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{cita.candidato.numero_documento}</div>
              </div>
            </div>
            {cita.candidato.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <Mail size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>CORREO</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{cita.candidato.email}</div>
                </div>
              </div>
            )}
            {cita.candidato.telefono && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <Phone size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>TELÉFONO</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{cita.candidato.telefono}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointment details card */}
        <div style={{ padding: '20px 22px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', display: 'grid', gap: '14px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Detalles de la cita</div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <CalendarDays size={15} color="#6366f1" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>FECHA Y HORARIO</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>{formatFull(cita.fecha_hora_inicio)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  {formatTime(cita.fecha_hora_inicio)} → {formatTime(cita.fecha_hora_fin)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Hash size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>CÓDIGO DE CITA</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{cita.codigo}</div>
              </div>
            </div>

            {cita.observaciones && (
              <div style={{ padding: '10px 14px', background: 'rgba(86,104,184,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(86,104,184,0.15)', fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.55 }}>
                {cita.observaciones}
              </div>
            )}
          </div>

          {/* Induction session link */}
          {cita.sesion_induccion && (
            <div style={{ padding: '12px 14px', background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.68rem', color: '#0ea5e9', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>SESIÓN DE INDUCCIÓN VINCULADA</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Sesión #{cita.sesion_induccion.sesion_id}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estado: <strong style={{ color: '#0ea5e9' }}>{cita.sesion_induccion.estado_sesion.replace('_', ' ')}</strong></span>
                {cita.sesion_induccion.area && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {cita.sesion_induccion.area}</span>}
              </div>
              <button
                type="button"
                style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.06)', color: '#0ea5e9', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/gh/inducciones')}
              >
                <ExternalLink size={11} /> Gestionar en inducciones
              </button>
            </div>
          )}

          {/* Quick links */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {cita.tipo_cita === 'INDUCCION' && !cita.sesion_induccion && (
              <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(86,104,184,0.3)', background: 'rgba(86,104,184,0.06)', color: '#6366f1', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/gh/inducciones')}>
                <User size={12} /> Crear sesión de inducción
              </button>
            )}
            {cita.tipo_cita === 'ENTREGA_DOTACION' && (
              <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(69,116,196,0.3)', background: 'rgba(69,116,196,0.06)', color: '#f59e0b', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/gh/dotacion')}>
                <Shirt size={12} /> Registrar entrega de dotación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      {actions.length > 0 && (
        <div className="animate-fade-up stagger-2" style={{ padding: '18px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Cambiar estado</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {actions.map((action) => (
              <button
                key={action.estado}
                type="button"
                disabled={actionLoading}
                onClick={() => void handleCambiarEstado(action)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: 'var(--radius-lg)', border: `1px solid ${action.border}`, background: action.bg, color: action.color, fontSize: '0.82rem', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.6 : 1, transition: 'all 0.15s' }}
              >
                {actionLoading ? <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} /> : <action.Icon size={14} />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Checklist ── */}
      <div className="animate-fade-up stagger-2">
        <ChecklistPanel tipoCita={cita.tipo_cita} />
      </div>

      {/* ── Delete zone ── */}
      {!isClosed && (
        <div className="animate-fade-up stagger-3" style={{ padding: '16px 20px', background: 'rgba(192,80,80,0.03)', border: '1px solid rgba(192,80,80,0.15)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Zona de riesgo</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Eliminar la cita la borra permanentemente junto a sus links de autogestion.</div>
          </div>
          {!showDeleteConfirm ? (
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(192,80,80,0.3)', background: 'transparent', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={13} /> Eliminar cita
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', color: '#ef4444', fontWeight: 600 }}>¿Confirmar eliminación?</span>
              <button type="button" className="btn-ghost" style={{ fontSize: '0.76rem', padding: '6px 12px' }} onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>Cancelar</button>
              <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => void handleEliminar()} disabled={actionLoading}>
                {actionLoading ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} /> : <Trash2 size={12} />}
                Sí, eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

