/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * HSE Dashboard — métricas en tiempo real del módulo HSE
 */

import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, AlertTriangle, Clock,
  ArrowRight, Activity, UserCheck,
  UserX, RefreshCw, Plus, Building2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'

// ── Helpers ───────────────────────────────────────────────────────
function formatMinutos(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

// ── MetricCard ────────────────────────────────────────────────────
function MetricCard({
  label, value, icon: Icon, color, bg, border, onClick, badge,
}: {
  label:    string
  value:    number | string
  icon:     React.ElementType
  color:    string
  bg:       string
  border:   string
  onClick?: () => void
  badge?:   string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding:      '20px 24px',
        background:   'var(--bg-surface)',
        border:       `1px solid ${border}`,
        borderRadius: 'var(--radius-xl)',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
        position:     'relative',
        overflow:     'hidden',
        boxShadow:    'var(--shadow-card)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        if (onClick) { el.style.borderColor = color; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-lg)' }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        if (onClick) { el.style.borderColor = border; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'var(--shadow-card)' }
      }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: bg, borderRadius: '50%', filter: 'blur(20px)' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
            {value}
          </div>
          {badge && (
            <div style={{ display: 'inline-flex', marginTop: '8px', padding: '2px 8px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', color, fontFamily: 'var(--font-mono)' }}>
              {badge}
            </div>
          )}
        </div>
        <div style={{ width: '40px', height: '40px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

// ── MetricCard skeleton ───────────────────────────────────────────
function MetricCardSkeleton() {
  return (
    <div style={{ padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '55%', height: '11px', marginBottom: '12px' }} />
          <div className="skeleton skeleton-text" style={{ width: '38%', height: '32px', marginBottom: '10px' }} />
          <div className="skeleton skeleton-text" style={{ width: '45%', height: '18px' }} />
        </div>
        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── No-sede empty state ───────────────────────────────────────────
function NoSedeState() {
  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <div style={{
        padding:      '48px 40px',
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow:    'var(--shadow-card)',
        textAlign:    'center',
      }}>
        <div style={{ marginBottom: '16px', opacity: 0.5 }}>
          <Building2 size={40} color="var(--text-muted)" />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Sin sede seleccionada
        </h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0 }}>
          Selecciona una sede en la barra superior para ver las métricas HSE en tiempo real.
        </p>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function HSEDashboardView() {
  const navigate   = useNavigate()
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const sedeId     = sedeActiva?.id ?? null
  const hasAnyRole = useAuthStore(s => s.hasAnyRole)
  const canManage  = hasAnyRole(['ADMIN_HSE', 'GESTION_HSE', 'ADMIN_GLOBAL'])
  const esVigilante = hasAnyRole(['VIGILANTE_HSE']) && !canManage

  const {
    data:       metrics,
    isPending:  isPendingMetrics,
    isFetching: isFetchingMetrics,
    refetch:    refetchMetrics,
  } = useQuery({
    queryKey: ['hse', 'dashboard', sedeId],
    queryFn:  () => hseService.getDashboard(sedeId as number),
    enabled:  Boolean(sedeId),
    refetchInterval: 120_000,
  })

  const {
    data:      dentro = [],
    isPending: isPendingDentro,
    refetch:   refetchDentro,
  } = useQuery({
    queryKey: ['hse', 'personas-dentro', sedeId],
    queryFn:  () => hseService.getPersonasDentro(sedeId as number),
    enabled:  Boolean(sedeId),
    refetchInterval: 30_000,
  })

  const isFetching = isFetchingMetrics
  const isLoading  = isPendingMetrics || isPendingDentro

  const otrosEstados = Math.max(
    0,
    (metrics?.total_autorizaciones ?? 0)
      - (metrics?.autorizaciones_activas ?? 0)
      - (metrics?.autorizaciones_pendientes ?? 0)
      - (metrics?.autorizaciones_vencidas ?? 0),
  )

  const estadoData = [
    { label: 'Aprobadas',     value: metrics?.autorizaciones_activas    ?? 0, color: 'var(--success-400)', bg: 'rgba(40,149,108,0.12)' },
    { label: 'En revisión',   value: metrics?.autorizaciones_pendientes  ?? 0, color: '#5668B8',            bg: 'rgba(86,104,184,0.12)' },
    { label: 'Vencidas',      value: metrics?.autorizaciones_vencidas    ?? 0, color: 'var(--danger-400)',  bg: 'rgba(192,80,80,0.12)' },
    { label: 'Otros estados', value: otrosEstados,                             color: 'var(--text-muted)',  bg: 'var(--bg-elevated)' },
  ]

  const riesgoData = [
    { label: 'Alto riesgo activos',    value: metrics?.alto_riesgo_activos ?? 0, color: 'var(--danger-400)',  bg: 'rgba(192,80,80,0.12)' },
    { label: 'Normal activos',         value: metrics?.normal_activos      ?? 0, color: 'var(--success-400)', bg: 'rgba(40,149,108,0.12)' },
    { label: 'Dentro con alerta > 8h', value: metrics?.alertas_activas     ?? 0, color: 'var(--warning-400)', bg: 'rgba(69,116,196,0.12)' },
  ]

  const totalAutorizaciones = metrics?.total_autorizaciones ?? 0
  const totalRiesgo = (metrics?.alto_riesgo_activos ?? 0) + (metrics?.normal_activos ?? 0)

  if (!sedeId) return <NoSedeState />

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div
        style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
        className="animate-fade-up"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={14} color="var(--success-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--success-400)', letterSpacing: '0.12em' }}>
              MÓDULO HSE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Dashboard HSE
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Salud, seguridad y medio ambiente — {sedeActiva?.nombre}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { void refetchMetrics(); void refetchDentro() }}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '8px 14px',
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color:        'var(--text-secondary)',
              fontSize:     '0.8rem',
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
            }}
          >
            <div style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none', display: 'flex' }}>
              <RefreshCw size={14} />
            </div>
            {isFetching ? 'Actualizando...' : 'Actualizar'}
          </button>
          {canManage ? (
            <button
              onClick={() => navigate('/hse/panel-general')}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '8px 16px',
                background:   'var(--gradient-primary)',
                border:       'none',
                borderRadius: 'var(--radius-md)',
                color:        'var(--text-inverted)',
                fontSize:     '0.8rem',
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
                boxShadow:    '0 2px 4px rgba(59,130,246,0.20), 0 6px 16px rgba(59,130,246,0.18)',
              }}
            >
              <Plus size={14} />
              Nueva Autorización
            </button>
          ) : (
            <button
              onClick={() => navigate('/hse/vigilante')}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '8px 16px',
                background:   'var(--gradient-primary)',
                border:       'none',
                borderRadius: 'var(--radius-md)',
                color:        'var(--text-inverted)',
                fontSize:     '0.8rem',
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
                boxShadow:    '0 2px 4px rgba(59,130,246,0.20), 0 6px 16px rgba(59,130,246,0.18)',
              }}
            >
              <ShieldCheck size={14} />
              Ir a portería
            </button>
          )}
        </div>
      </div>

      {/* ── Métricas principales ─────────────────────────────── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}
        className="animate-fade-up stagger-1"
      >
        {isLoading ? (
          Array.from({ length: esVigilante ? 2 : 6 }, (_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            {canManage && (
              <MetricCard label="Total autorizaciones" value={metrics?.total_autorizaciones ?? 0} icon={ShieldCheck} color="var(--primary-400)" bg="rgba(69,116,196,0.08)" border="rgba(69,116,196,0.15)" onClick={() => navigate('/hse/panel-general')} />
            )}
            {canManage && (
              <MetricCard label="Activas aprobadas" value={metrics?.autorizaciones_activas ?? 0} icon={UserCheck} color="var(--success-400)" bg="rgba(40,149,108,0.08)" border="rgba(40,149,108,0.15)" badge="APROBADO" />
            )}
            {canManage && (
              <MetricCard label="En revisión" value={metrics?.autorizaciones_pendientes ?? 0} icon={Clock} color="#5668B8" bg="rgba(86,104,184,0.08)" border="rgba(86,104,184,0.15)" onClick={() => navigate('/hse/gestion')} badge="PENDIENTE" />
            )}
            {canManage && (
              <MetricCard label="Vencidas" value={metrics?.autorizaciones_vencidas ?? 0} icon={UserX} color="var(--danger-400)" bg="rgba(192,80,80,0.08)" border="rgba(192,80,80,0.15)" badge="VENCIDO" />
            )}
            <MetricCard label="Dentro ahora" value={metrics?.contratistas_dentro_ahora ?? dentro.length} icon={Activity} color="var(--success-400)" bg="rgba(40,149,108,0.08)" border="rgba(40,149,108,0.15)" onClick={() => navigate('/hse/vigilante')} />
            <MetricCard label="Alertas activas" value={metrics?.alertas_activas ?? 0} icon={AlertTriangle} color={metrics?.alertas_activas ? 'var(--danger-400)' : 'var(--text-muted)'} bg={metrics?.alertas_activas ? 'rgba(192,80,80,0.08)' : 'var(--bg-elevated)'} border={metrics?.alertas_activas ? 'rgba(192,80,80,0.2)' : 'var(--border-subtle)'} />
          </>
        )}
      </div>

      {/* ── Gráficas resumen (gestión) ───────────────────────── */}
      {canManage && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}
          className="animate-fade-up stagger-2"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Distribución de autorizaciones</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estado actual de solicitudes HSE</div>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Total: {totalAutorizaciones}</span>
          </div>

          {isLoading ? (
            <div className="skeleton skeleton-text" style={{ height: '12px', borderRadius: '999px', marginBottom: '14px' }} />
          ) : (
            <div style={{ display: 'flex', height: '12px', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              {estadoData.filter(s => s.value > 0).map((segmento) => (
                <div key={segmento.label} style={{ width: `${pct(segmento.value, totalAutorizaciones)}%`, background: segmento.color, minWidth: '6px' }} title={`${segmento.label}: ${segmento.value}`} />
              ))}
            </div>
          )}

          <div style={{ marginTop: '14px', display: 'grid', gap: '8px' }}>
            {isLoading ? (
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center' }}>
                  <div className="skeleton skeleton-text" style={{ height: '12px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '20px', height: '12px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '28px', height: '12px' }} />
                </div>
              ))
            ) : (
              estadoData.map((item) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', fontSize: '0.77rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color, border: '1px solid var(--border-subtle)', flexShrink: 0 }} />
                    {item.label}
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pct(item.value, totalAutorizaciones)}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}
          className="animate-fade-up stagger-3"
        >
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Riesgo operativo y alertas</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contratistas aprobados por tipo y exposición de tiempo</div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '55%', height: '12px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '20px', height: '12px' }} />
                  </div>
                  <div className="skeleton skeleton-text" style={{ height: '10px', borderRadius: '999px' }} />
                </div>
              ))
            ) : (
              riesgoData.map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '999px', background: item.bg, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct(item.value, item.label.includes('alerta') ? (metrics?.contratistas_dentro_ahora ?? 0) : totalRiesgo)}%`, height: '100%', background: item.color }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── Grid inferior ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

        {/* Personas dentro ahora */}
        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}
          className="animate-fade-up stagger-2"
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} color="var(--success-400)" />
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Personas dentro ahora</span>
              {dentro.length > 0 && (
                <span style={{ padding: '1px 8px', background: 'rgba(40,149,108,0.1)', border: '1px solid rgba(40,149,108,0.2)', borderRadius: '20px', fontSize: '0.7rem', color: 'var(--success-400)', fontFamily: 'var(--font-mono)' }}>
                  {dentro.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/hse/vigilante')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
            >
              Ver todo <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {isPendingDentro ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="skeleton skeleton-round" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '58%', height: '13px', marginBottom: '6px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '38%', height: '11px' }} />
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '32px', height: '13px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '48px', height: '11px' }} />
                  </div>
                </div>
              ))
            ) : dentro.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ marginBottom: '12px', opacity: 0.4 }}>
                  <Users size={28} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sin contratistas dentro</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>No hay registros de ingreso activos en esta sede</div>
              </div>
            ) : (
              dentro.map((p) => (
                <div key={p.contratista_id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background:   p.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(192,80,80,0.1)' : 'rgba(40,149,108,0.1)',
                      border:       `1px solid ${p.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(192,80,80,0.2)' : 'rgba(40,149,108,0.2)'}`,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      fontSize:       '0.75rem',
                      fontWeight:     600,
                      color:          p.tipo_contratista === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)',
                      flexShrink:     0,
                    }}>
                      {p.nombre.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.numero_documento}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: p.alerta_tiempo ? 'var(--danger-400)' : 'var(--text-secondary)', fontWeight: p.alerta_tiempo ? 600 : 400 }}>
                      {formatMinutos(p.minutos_dentro)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: p.tipo_contratista === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)', marginTop: '2px' }}>
                      {p.tipo_contratista === 'ALTO_RIESGO' ? '⚠ Alto Riesgo' : 'Normal'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}
          className="animate-fade-up stagger-3"
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Accesos rápidos</span>
          </div>

          <div style={{ padding: '12px' }}>
            {[
              { label: 'Panel General',     desc: 'Crear y gestionar autorizaciones',   icon: ShieldCheck,   color: 'var(--primary-400)', bg: 'rgba(69,116,196,0.08)',  path: '/hse/panel-general' },
              { label: 'Gestión HSE',       desc: 'Revisar y aprobar solicitudes',       icon: UserCheck,     color: '#5668B8',             bg: 'rgba(86,104,184,0.08)', path: '/hse/gestion' },
              { label: 'Portal Vigilante',  desc: 'Verificar acceso en portería',        icon: Users,         color: 'var(--success-400)', bg: 'rgba(40,149,108,0.08)', path: '/hse/vigilante' },
              { label: 'Excepciones',       desc: 'Gestionar pre-aprobados especiales',  icon: AlertTriangle, color: 'var(--danger-400)',  bg: 'rgba(192,80,80,0.08)',  path: '/hse/excepciones' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width:        '100%',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  padding:      '12px',
                  background:   'transparent',
                  border:       '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  cursor:       'pointer',
                  textAlign:    'left',
                  marginBottom: '4px',
                  transition:   'background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background  = item.bg
                  el.style.borderColor = 'var(--border-subtle)'
                  el.style.transform   = 'translateX(3px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background  = 'transparent'
                  el.style.borderColor = 'transparent'
                  el.style.transform   = 'translateX(0)'
                }}
              >
                <div style={{ width: '36px', height: '36px', background: item.bg, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={16} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{item.desc}</div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
