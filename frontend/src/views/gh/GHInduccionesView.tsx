import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Link2,
  LogIn,
  LogOut,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Send,
  Square,
  Timer,
  UserCheck,
  Users,
  Video,
  Wifi,
  X,
} from 'lucide-react'

import { useSedeStore } from '@/store'
import { useGHCitas } from '@/hooks/gh/useGHCitas'
import {
  useCambiarEstadoSesionInduccion,
  useCrearGHSesionInduccion,
  useEnviarLinksInduccion,
  useGenerarCodigoCheckin,
  useGenerarCodigoCheckout,
  useGHSesionesInduccion,
} from '@/hooks/gh/useGHInducciones'
import type { GhCita, GhSesionInduccion, GhTipoSesion } from '@/types/gh'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatWindow(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const dateLabel = s.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })
  const timeStart = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const timeEnd = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { dateLabel: dateLabel.toUpperCase(), timeRange: `${timeStart} – ${timeEnd}` }
}

function toDateTimeLocalValue(value: string) {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copiado al portapapeles'),
    () => toast.error('No se pudo copiar'),
  )
}

// ─── CodeTimer ────────────────────────────────────────────────────────────────

function CodeTimer({ expiraEn }: { expiraEn: string }) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000))
      setRemaining(diff)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [expiraEn])
  if (remaining === 0) return <span style={{ color: 'var(--danger-400)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>EXPIRADO</span>
  const min = Math.floor(remaining / 60)
  const sec = remaining % 60
  const pct = Math.min(100, (remaining / 300) * 100)
  const color = remaining > 120 ? '#10b981' : remaining > 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `conic-gradient(${color} ${pct}%, transparent 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Timer size={10} color={color} />
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color, fontWeight: 700 }}>
        {min}:{String(sec).padStart(2, '0')}
      </span>
    </div>
  )
}

// ─── TipoSesionBadge ──────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<GhTipoSesion, { Icon: any; label: string; color: string; bg: string }> = {
  PRESENCIAL: { Icon: Building2, label: 'Presencial', color: '#10b981', bg: 'rgba(40,149,108,0.10)' },
  VIRTUAL: { Icon: Video, label: 'Virtual', color: '#6366f1', bg: 'rgba(86,104,184,0.10)' },
  HIBRIDA: { Icon: Wifi, label: 'Híbrida', color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
}

function TipoSesionBadge({ tipo }: { tipo: GhTipoSesion }) {
  const cfg = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.PRESENCIAL
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: 'var(--radius-full)', background: cfg.bg, border: `1px solid ${cfg.color}30`, fontSize: '0.7rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ─── EstadoBadge ──────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { color: string; bg: string; pulse?: boolean }> = {
  EN_CURSO: { color: '#10b981', bg: 'rgba(40,149,108,0.10)', pulse: true },
  PROGRAMADA: { color: '#6366f1', bg: 'rgba(86,104,184,0.08)' },
  FINALIZADA: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  CERRADA: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
  CANCELADA: { color: '#ef4444', bg: 'rgba(192,80,80,0.08)' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { color: 'var(--text-muted)', bg: 'var(--bg-base)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: cfg.bg, border: `1px solid ${cfg.color}30`, fontSize: '0.71rem', fontWeight: 800, color: cfg.color, letterSpacing: '0.06em' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, animation: cfg.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
      {estado.replace('_', ' ')}
    </span>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color, bg }: { label: string; value: number | string; icon: any; color: string; bg: string }) {
  return (
    <div className="animate-fade-up glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden', border: `1px solid ${color}15` }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: bg, borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: bg, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  )
}

// ─── SesionCard ───────────────────────────────────────────────────────────────

function SesionCard({
  sesion,
  onIniciar,
  onFinalizar,
  onCancelar,
  onGenerarCheckin,
  onGenerarCheckout,
  onEnviarLinks,
  loadingId,
}: {
  sesion: GhSesionInduccion
  onIniciar: (id: number) => void
  onFinalizar: (id: number) => void
  onCancelar: (id: number) => void
  onGenerarCheckin: (id: number) => void
  onGenerarCheckout: (id: number) => void
  onEnviarLinks: (id: number) => void
  loadingId: number | null
}) {
  const [expanded, setExpanded] = useState(false)
  const { dateLabel, timeRange } = formatWindow(sesion.fecha_hora_inicio, sesion.fecha_hora_fin)
  const isLoading = loadingId === sesion.id
  const pctCheckin = sesion.total_asistentes ? Math.round((sesion.total_checkin / sesion.total_asistentes) * 100) : 0
  const pctCheckout = sesion.total_asistentes ? Math.round((sesion.total_checkout / sesion.total_asistentes) * 100) : 0

  return (
    <div
      className="animate-fade-up"
      style={{
        border: sesion.estado_sesion === 'EN_CURSO' ? '1.5px solid rgba(40,149,108,0.30)' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        background: sesion.estado_sesion === 'EN_CURSO' ? 'rgba(40,149,108,0.03)' : 'var(--bg-surface)',
        overflow: 'hidden',
        boxShadow: sesion.estado_sesion === 'EN_CURSO' ? '0 0 24px rgba(40,149,108,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <EstadoBadge estado={sesion.estado_sesion} />
              <TipoSesionBadge tipo={sesion.tipo_sesion} />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {sesion.area}
              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.85rem' }}>· {sesion.tipo_induccion}</span>
            </div>
            {sesion.descripcion && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sesion.descripcion}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CalendarDays size={12} />
                {dateLabel} · {timeRange}
              </span>
              {sesion.sala_fisica && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building2 size={12} />
                  {sesion.sala_fisica}
                </span>
              )}
              {sesion.link_virtual && (
                <a
                  href={sesion.link_virtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}
                >
                  <Video size={12} />
                  Unirse a la reunión
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>{sesion.total_asistentes}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Asistentes</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 14px', background: pctCheckin > 0 ? 'rgba(40,149,108,0.06)' : 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: `1px solid ${pctCheckin > 0 ? 'rgba(40,149,108,0.2)' : 'var(--border-subtle)'}` }}>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: pctCheckin > 0 ? '#10b981' : 'var(--text-primary)' }}>{sesion.total_checkin}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Check-in</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 14px', background: pctCheckout > 0 ? 'rgba(14,165,233,0.06)' : 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: `1px solid ${pctCheckout > 0 ? 'rgba(14,165,233,0.2)' : 'var(--border-subtle)'}` }}>
              <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: pctCheckout > 0 ? '#0ea5e9' : 'var(--text-primary)' }}>{sesion.total_checkout}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Check-out</div>
            </div>
          </div>
        </div>

        {/* Progress bar (only when there are attendees) */}
        {sesion.total_asistentes > 0 && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '5px', borderRadius: '999px', background: 'var(--bg-elevated)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctCheckout}%`, background: '#0ea5e9', borderRadius: '999px', transition: 'width 0.5s ease' }} />
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctCheckin}%`, background: '#10b981', borderRadius: '999px', opacity: 0.5, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{pctCheckin}% entrada</span>
          </div>
        )}

        {/* Codes section (shown when EN_CURSO) */}
        {sesion.estado_sesion === 'EN_CURSO' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <CodeDisplay
              label="Código Check-in"
              code={sesion.codigo_checkin_actual}
              onGenerate={() => onGenerarCheckin(sesion.id)}
              isLoading={isLoading}
              type="CHECKIN"
            />
            <CodeDisplay
              label="Código Check-out"
              code={sesion.codigo_checkout_actual}
              onGenerate={() => onGenerarCheckout(sesion.id)}
              isLoading={isLoading}
              type="CHECKOUT"
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {sesion.estado_sesion === 'PROGRAMADA' && (
              <>
                <button
                  className="btn-primary"
                  style={{ padding: '7px 18px', fontSize: '0.78rem', gap: '6px' }}
                  onClick={() => onIniciar(sesion.id)}
                  disabled={isLoading}
                >
                  <Play size={13} />
                  Iniciar sesión
                </button>
                <button
                  className="btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '0.78rem', gap: '6px', color: 'var(--danger-400)' }}
                  onClick={() => onCancelar(sesion.id)}
                  disabled={isLoading}
                >
                  <X size={13} />
                  Cancelar
                </button>
              </>
            )}
            {sesion.estado_sesion === 'EN_CURSO' && (
              <>
                <button
                  className="btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '0.78rem', gap: '6px' }}
                  onClick={() => onEnviarLinks(sesion.id)}
                  disabled={isLoading}
                  title="Enviar links de autogestion a todos los asistentes"
                >
                  <Send size={13} />
                  Enviar links
                </button>
                <button
                  className="btn-ghost"
                  style={{ padding: '7px 18px', fontSize: '0.78rem', gap: '6px', color: '#ef4444', borderColor: '#ef444433' }}
                  onClick={() => onFinalizar(sesion.id)}
                  disabled={isLoading}
                >
                  <Square size={13} />
                  Finalizar
                </button>
              </>
            )}
          </div>
          {sesion.asistentes.length > 0 && (
            <button
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.76rem', gap: '6px' }}
              onClick={() => setExpanded((v) => !v)}
            >
              <Users size={13} />
              {expanded ? 'Ocultar' : 'Ver'} asistentes ({sesion.asistentes.length})
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded attendees list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['Persona', 'Documento', 'Estado', 'Check-in', 'Check-out', 'Link autogestion'].map((h) => (
                    <th key={h} align="left" style={{ padding: '10px 16px', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sesion.asistentes.map((a) => {
                  const aLink = `${window.location.origin}/portal/gh/induccion/${a.token_autogestion}`
                  const estadoColor = a.estado_asistencia === 'EN_SESION' || a.estado_asistencia === 'CHECKOUT_OK' ? '#10b981' : a.estado_asistencia === 'NO_ASISTIO' ? '#ef4444' : 'var(--text-secondary)'
                  return (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.candidato.nombres} {a.candidato.apellidos}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {a.candidato.tipo_documento} {a.candidato.numero_documento}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: estadoColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {a.estado_asistencia.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {a.checkin_at ? new Date(a.checkin_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {a.checkout_at ? new Date(a.checkout_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: '0.7rem', gap: '4px' }}
                            onClick={() => copyToClipboard(aLink)}
                            title="Copiar link"
                          >
                            <Copy size={11} />
                            Copiar
                          </button>
                          <a
                            href={aLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--primary-400)', textDecoration: 'none' }}
                          >
                            <ExternalLink size={11} />
                            Abrir
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CodeDisplay ──────────────────────────────────────────────────────────────

function CodeDisplay({
  label,
  code,
  onGenerate,
  isLoading,
  type,
}: {
  label: string
  code: string | null
  onGenerate: () => void
  isLoading: boolean
  type: 'CHECKIN' | 'CHECKOUT'
}) {
  const color = type === 'CHECKIN' ? '#10b981' : '#0ea5e9'
  return (
    <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: code ? `rgba(${type === 'CHECKIN' ? '16,185,129' : '14,165,233'},0.06)` : 'var(--bg-elevated)', border: `1px solid ${code ? `${color}25` : 'var(--border-subtle)'}` }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {type === 'CHECKIN' ? <LogIn size={11} /> : <LogOut size={11} />}
        {label}
      </div>
      {code ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 900, color, letterSpacing: '0.1em' }}>{code}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.7rem', gap: '4px' }} onClick={() => copyToClipboard(code)}>
              <Copy size={11} /> Copiar
            </button>
            <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.7rem', gap: '4px' }} onClick={onGenerate} disabled={isLoading}>
              <RefreshCw size={11} /> Nuevo
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: '0.78rem', gap: '6px', width: '100%', justifyContent: 'center' }} onClick={onGenerate} disabled={isLoading}>
          {type === 'CHECKIN' ? <LogIn size={13} /> : <LogOut size={13} />}
          Generar código
        </button>
      )}
    </div>
  )
}

// ─── TipoSesionSelector ───────────────────────────────────────────────────────

function TipoSesionSelector({
  value,
  onChange,
}: {
  value: GhTipoSesion
  onChange: (v: GhTipoSesion) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {(Object.entries(TIPO_CONFIG) as [GhTipoSesion, (typeof TIPO_CONFIG)[GhTipoSesion]][]).map(([tipo, cfg]) => (
        <label
          key={tipo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-lg)',
            border: value === tipo ? `1.5px solid ${cfg.color}` : '1px solid var(--border-subtle)',
            background: value === tipo ? cfg.bg : 'var(--bg-surface)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <input type="radio" name="tipo_sesion" value={tipo} checked={value === tipo} onChange={() => onChange(tipo)} style={{ display: 'none' }} />
          <cfg.Icon size={14} color={value === tipo ? cfg.color : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: value === tipo ? cfg.color : 'var(--text-secondary)' }}>{cfg.label}</span>
        </label>
      ))}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

const AREAS_SUGERIDAS = ['Operaciones', 'SST', 'Comercial', 'Logística', 'Administración', 'Producción', 'RRHH']
const TIPOS_INDUCCION_SUGERIDOS = ['General empresa', 'Seguridad y SST', 'Bienvenida', 'Proceso operativo', 'Atención al cliente', 'Normativa interna']

export default function GHInduccionesView() {
  const sede = useSedeStore((s) => s.sedeActiva)
  const sedeId = sede?.id ?? 0

  const { data: sesiones = [], isLoading, isFetching, refetch } = useGHSesionesInduccion({ sede_id: sedeId })
  const { data: citasInduccion = [] } = useGHCitas({ sede_id: sedeId, tipo_cita: 'INDUCCION', page: 1, per_page: 200 })

  const crearSesion = useCrearGHSesionInduccion()
  const codigoCheckinMutation = useGenerarCodigoCheckin()
  const codigoCheckoutMutation = useGenerarCodigoCheckout()
  const cambiarEstado = useCambiarEstadoSesionInduccion()
  const enviarLinks = useEnviarLinksInduccion()

  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [selectedCitaIds, setSelectedCitaIds] = useState<number[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [form, setForm] = useState({
    area: '',
    tipo_induccion: '',
    tipo_sesion: 'PRESENCIAL' as GhTipoSesion,
    link_virtual: '',
    sala_fisica: '',
    descripcion: '',
    capacidad_maxima: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
  })

  const eligibleCitas = useMemo(
    () => citasInduccion.filter((c) => !c.sesion_induccion && !['CANCELADA', 'NO_ASISTIO', 'FINALIZADA'].includes(c.estado)),
    [citasInduccion],
  )

  const selectedCitas = useMemo(
    () => eligibleCitas.filter((c) => selectedCitaIds.includes(c.id)),
    [eligibleCitas, selectedCitaIds],
  )

  useEffect(() => {
    if (!selectedCitas.length) return
    const sorted = [...selectedCitas].sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())
    setForm((prev) => ({
      ...prev,
      fecha_hora_inicio: sorted[0]?.fecha_hora_inicio ? toDateTimeLocalValue(sorted[0].fecha_hora_inicio) : prev.fecha_hora_inicio,
      fecha_hora_fin: sorted[sorted.length - 1]?.fecha_hora_fin ? toDateTimeLocalValue(sorted[sorted.length - 1].fecha_hora_fin) : prev.fecha_hora_fin,
    }))
  }, [selectedCitas])

  const sesionesFiltered = useMemo(
    () => (filtroEstado ? sesiones.filter((s) => s.estado_sesion === filtroEstado) : sesiones),
    [sesiones, filtroEstado],
  )

  const metrics = useMemo(() => ({
    total: sesiones.length,
    activas: sesiones.filter((s) => s.estado_sesion === 'EN_CURSO').length,
    programadas: sesiones.filter((s) => s.estado_sesion === 'PROGRAMADA').length,
    asistentesHoy: sesiones.filter((s) => s.estado_sesion === 'EN_CURSO').reduce((acc, s) => acc + s.total_asistentes, 0),
  }), [sesiones])

  const resetForm = useCallback(() => {
    setOpenModal(false)
    setSelectedCitaIds([])
    setForm({ area: '', tipo_induccion: '', tipo_sesion: 'PRESENCIAL', link_virtual: '', sala_fisica: '', descripcion: '', capacidad_maxima: '', fecha_hora_inicio: '', fecha_hora_fin: '' })
  }, [])

  const handleCreateSession = useCallback(() => {
    if (!form.area.trim() || !form.tipo_induccion.trim() || !form.fecha_hora_inicio || !form.fecha_hora_fin) {
      toast.error('Completa el área, tipo de inducción y ventana operativa.')
      return
    }
    if (form.tipo_sesion === 'VIRTUAL' && !form.link_virtual.trim()) {
      toast.error('Para sesiones virtuales debes ingresar el link de la reunión.')
      return
    }

    crearSesion.mutate(
      {
        sede_id: sedeId,
        area: form.area.trim(),
        tipo_induccion: form.tipo_induccion.trim(),
        tipo_sesion: form.tipo_sesion,
        link_virtual: form.link_virtual.trim() || null,
        sala_fisica: form.sala_fisica.trim() || null,
        descripcion: form.descripcion.trim() || null,
        capacidad_maxima: form.capacidad_maxima ? parseInt(form.capacidad_maxima) : null,
        fecha_hora_inicio: new Date(form.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(form.fecha_hora_fin).toISOString(),
        cita_ids: selectedCitaIds,
        asistentes: [],
      },
      {
        onSuccess: () => {
          toast.success(`Sesión ${form.tipo_sesion.toLowerCase()} creada exitosamente.`)
          resetForm()
        },
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }, [form, selectedCitaIds, sedeId, crearSesion, resetForm])

  const handleIniciar = useCallback((id: number) => {
    setLoadingId(id)
    cambiarEstado.mutate(
      { id, payload: { estado_sesion: 'EN_CURSO' } },
      { onSuccess: () => { toast.success('Sesión iniciada.'); setLoadingId(null) }, onError: () => setLoadingId(null) },
    )
  }, [cambiarEstado])

  const handleFinalizar = useCallback((id: number) => {
    if (!confirm('¿Confirmas finalizar esta sesión? Las citas vinculadas serán marcadas como finalizadas.')) return
    setLoadingId(id)
    cambiarEstado.mutate(
      { id, payload: { estado_sesion: 'FINALIZADA' } },
      { onSuccess: () => { toast.success('Sesión finalizada.'); setLoadingId(null) }, onError: () => setLoadingId(null) },
    )
  }, [cambiarEstado])

  const handleCancelar = useCallback((id: number) => {
    if (!confirm('¿Confirmas cancelar esta sesión?')) return
    setLoadingId(id)
    cambiarEstado.mutate(
      { id, payload: { estado_sesion: 'CANCELADA' } },
      { onSuccess: () => { toast.success('Sesión cancelada.'); setLoadingId(null) }, onError: () => setLoadingId(null) },
    )
  }, [cambiarEstado])

  const handleGenerarCheckin = useCallback((id: number) => {
    setLoadingId(id)
    codigoCheckinMutation.mutate(id, {
      onSuccess: (r) => { toast.success(`Código Check-in: ${r.codigo} (válido 5 min)`); setLoadingId(null) },
      onError: () => setLoadingId(null),
    })
  }, [codigoCheckinMutation])

  const handleGenerarCheckout = useCallback((id: number) => {
    setLoadingId(id)
    codigoCheckoutMutation.mutate(id, {
      onSuccess: (r) => { toast.success(`Código Check-out: ${r.codigo} (válido 5 min)`); setLoadingId(null) },
      onError: () => setLoadingId(null),
    })
  }, [codigoCheckoutMutation])

  const handleEnviarLinks = useCallback((id: number) => {
    if (!confirm('¿Enviar links de autogestion a todos los asistentes de esta sesión?')) return
    setLoadingId(id)
    enviarLinks.mutate(id, {
      onSuccess: () => { toast.success('Links enviados a los asistentes.'); setLoadingId(null) },
      onError: () => setLoadingId(null),
    })
  }, [enviarLinks])

  if (!sede) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] glass rounded-2xl border border-[var(--border-subtle)] text-center p-8">
        <Info size={40} color="var(--border-subtle)" style={{ marginBottom: '16px' }} />
        <div className="text-[var(--text-muted)] text-base font-medium">Selecciona una sede para gestionar inducciones.</div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = { width: '100%', height: '44px', padding: '0 14px', fontSize: '0.85rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="status-dot active animate-pulse" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary-400)', letterSpacing: '0.15em', fontWeight: 800 }}>GH · INDUCCIONES OPERATIVAS</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Sesiones de Inducción</h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Gestiona sesiones presenciales, virtuales e híbridas. Controla asistencia con códigos QR y links de autogestion.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Sincronizando
            </div>
          )}
          <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }} onClick={() => refetch()}>
            <RefreshCw size={14} />
          </button>
          <button className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.85rem', gap: '8px' }} onClick={() => setOpenModal(true)}>
            <Plus size={16} />
            Nueva sesión
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <MetricCard label="Total sesiones" value={metrics.total} icon={CalendarDays} color="#0ea5e9" bg="rgba(14,165,233,0.12)" />
        <MetricCard label="En curso ahora" value={metrics.activas} icon={Play} color="#10b981" bg="rgba(40,149,108,0.12)" />
        <MetricCard label="Programadas" value={metrics.programadas} icon={Clock} color="#6366f1" bg="rgba(86,104,184,0.12)" />
        <MetricCard label="Asistentes activos" value={metrics.asistentesHoy} icon={UserCheck} color="#f59e0b" bg="rgba(69,116,196,0.12)" />
      </div>

      {/* Pending citations panel */}
      {eligibleCitas.length > 0 && (
        <div className="animate-fade-up stagger-2" style={{ border: '1px solid rgba(86,104,184,0.25)', borderRadius: 'var(--radius-xl)', background: 'rgba(86,104,184,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid rgba(86,104,184,0.15)' }}>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={15} color="#6366f1" />
                {eligibleCitas.length} cita{eligibleCitas.length !== 1 ? 's' : ''} de inducción pendiente{eligibleCitas.length !== 1 ? 's' : ''} por vincular
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>Estas citas están en agenda pero aún no forman parte de una sesión operativa.</div>
            </div>
            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem', gap: '6px' }} onClick={() => setOpenModal(true)}>
              <Plus size={14} />
              Crear sesión
            </button>
          </div>
          <div style={{ padding: '14px 24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {eligibleCitas.slice(0, 6).map((cita) => {
              const { dateLabel, timeRange } = formatWindow(cita.fecha_hora_inicio, cita.fecha_hora_fin)
              return (
                <button
                  key={cita.id}
                  className="btn-ghost"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '10px 14px', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}
                  onClick={() => { setOpenModal(true); setSelectedCitaIds((p) => p.includes(cita.id) ? p : [...p, cita.id]) }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cita.candidato.nombres} {cita.candidato.apellidos}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{dateLabel} · {timeRange}</span>
                </button>
              )
            })}
            {eligibleCitas.length > 6 && (
              <button className="btn-ghost" style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }} onClick={() => setOpenModal(true)}>
                +{eligibleCitas.length - 6} más...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="animate-fade-up stagger-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sesiones registradas {sesionesFiltered.length !== sesiones.length && `(${sesionesFiltered.length} de ${sesiones.length})`}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', 'PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA'].map((e) => (
              <button
                key={e}
                className={filtroEstado === e ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                onClick={() => setFiltroEstado(e)}
              >
                {e || 'Todas'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando sesiones...</div>
        ) : sesionesFiltered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)' }}>
            <CalendarDays size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No hay sesiones {filtroEstado && `en estado "${filtroEstado}"`}</div>
            <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>Crea una sesión vinculando citas de inducción o agregando asistentes directos.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {sesionesFiltered.map((sesion) => (
              <SesionCard
                key={sesion.id}
                sesion={sesion}
                onIniciar={handleIniciar}
                onFinalizar={handleFinalizar}
                onCancelar={handleCancelar}
                onGenerarCheckin={handleGenerarCheckin}
                onGenerarCheckout={handleGenerarCheckout}
                onEnviarLinks={handleEnviarLinks}
                loadingId={loadingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create session modal */}
      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}
        >
          <div className="glass animate-scale-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '92vh', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-strong)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Nueva sesión de inducción</div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Configurar sesión</h3>
              </div>
              <button className="btn-ghost" style={{ padding: '8px' }} onClick={resetForm}><X size={18} /></button>
            </div>

            {/* Modal body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 0, flex: 1, overflowY: 'auto' }}>
              {/* Left: citation selection */}
              <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Citas a vincular
                  {selectedCitaIds.length > 0 && (
                    <span style={{ marginLeft: '8px', padding: '2px 10px', background: 'rgba(86,104,184,0.1)', color: '#6366f1', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700 }}>
                      {selectedCitaIds.length} seleccionadas
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Opcional — también puedes crear la sesión sin vincular citas.
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '8px', maxHeight: '380px' }}>
                  {eligibleCitas.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No hay citas de inducción elegibles.
                    </div>
                  ) : (
                    eligibleCitas.map((cita) => {
                      const selected = selectedCitaIds.includes(cita.id)
                      const { dateLabel, timeRange } = formatWindow(cita.fecha_hora_inicio, cita.fecha_hora_fin)
                      return (
                        <label
                          key={cita.id}
                          style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: selected ? '1.5px solid rgba(86,104,184,0.4)' : '1px solid var(--border-subtle)', background: selected ? 'rgba(86,104,184,0.06)' : 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.12s ease' }}
                        >
                          <input type="checkbox" checked={selected} onChange={() => setSelectedCitaIds((p) => p.includes(cita.id) ? p.filter((id) => id !== cita.id) : [...p, cita.id])} style={{ accentColor: '#6366f1', width: '15px', height: '15px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cita.candidato.nombres} {cita.candidato.apellidos}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                              {cita.candidato.tipo_documento} {cita.candidato.numero_documento} · {dateLabel} {timeRange}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
                {selectedCitaIds.length > 0 && (
                  <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '6px', color: 'var(--danger-400)' }} onClick={() => setSelectedCitaIds([])}>
                    Deseleccionar todas
                  </button>
                )}
              </div>

              {/* Right: session config */}
              <div style={{ padding: '24px 28px', display: 'grid', gap: '18px', alignContent: 'start' }}>
                <div>
                  <div style={{ ...labelStyle, marginBottom: '8px' }}>Tipo de sesión</div>
                  <TipoSesionSelector value={form.tipo_sesion} onChange={(v) => setForm({ ...form, tipo_sesion: v, link_virtual: '' })} />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={labelStyle}>Área *</label>
                  <input list="areas-list" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Ej: Operaciones, SST..." style={inputStyle} />
                  <datalist id="areas-list">{AREAS_SUGERIDAS.map((a) => <option key={a} value={a} />)}</datalist>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={labelStyle}>Tipo de inducción *</label>
                  <input list="tipos-list" value={form.tipo_induccion} onChange={(e) => setForm({ ...form, tipo_induccion: e.target.value })} placeholder="Ej: General, Seguridad..." style={inputStyle} />
                  <datalist id="tipos-list">{TIPOS_INDUCCION_SUGERIDOS.map((t) => <option key={t} value={t} />)}</datalist>
                </div>

                {(form.tipo_sesion === 'VIRTUAL' || form.tipo_sesion === 'HIBRIDA') && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={{ ...labelStyle, color: '#6366f1' }}>
                      <Video size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      Link de reunión {form.tipo_sesion === 'VIRTUAL' ? '*' : ''}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Link2 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
                      <input
                        type="url"
                        value={form.link_virtual}
                        onChange={(e) => setForm({ ...form, link_virtual: e.target.value })}
                        placeholder="https://meet.google.com/ · teams.microsoft.com · zoom.us/..."
                        style={{ ...inputStyle, paddingLeft: '36px' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Compatible con Zoom, Teams, Google Meet, Webex.</div>
                  </div>
                )}

                {(form.tipo_sesion === 'PRESENCIAL' || form.tipo_sesion === 'HIBRIDA') && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>
                      <Building2 size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      Sala / Lugar físico
                    </label>
                    <input
                      value={form.sala_fisica}
                      onChange={(e) => setForm({ ...form, sala_fisica: e.target.value })}
                      placeholder="Ej: Sala de capacitación 1..."
                      style={inputStyle}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>Inicio *</label>
                    <input type="datetime-local" value={form.fecha_hora_inicio} onChange={(e) => setForm({ ...form, fecha_hora_inicio: e.target.value })} style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>Fin *</label>
                    <input type="datetime-local" value={form.fecha_hora_fin} onChange={(e) => setForm({ ...form, fecha_hora_fin: e.target.value })} style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={labelStyle}>Descripción (opcional)</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Temas a cubrir, requisitos, instrucciones..."
                    rows={2}
                    style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }}
                  />
                </div>

                {/* Summary */}
                <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'grid', gap: '6px' }}>
                  <div>Citas vinculadas: <strong style={{ color: 'var(--text-primary)' }}>{selectedCitaIds.length}</strong></div>
                  <div>Tipo de sesión: <strong style={{ color: TIPO_CONFIG[form.tipo_sesion]?.color ?? 'var(--text-primary)' }}>{TIPO_CONFIG[form.tipo_sesion]?.label}</strong></div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
              <button className="btn-ghost" style={{ padding: '10px 22px', fontSize: '0.85rem' }} onClick={resetForm}>Cancelar</button>
              <button
                className="btn-primary glow-primary"
                style={{ padding: '10px 28px', fontSize: '0.85rem' }}
                onClick={handleCreateSession}
                disabled={crearSesion.isPending}
              >
                {crearSesion.isPending ? (
                  <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</>
                ) : (
                  <><Plus size={14} /> Crear sesión</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

