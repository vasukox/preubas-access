import { useMemo, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  ClipboardList,
  Clock3,
  Plus,
  RefreshCw,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  Video,
  Building2,
  Wifi,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useSedeStore } from '@/store'
import { ghService } from '@/services/gh.service'
import type { GhCita, GhSesionInduccion, GhTipoCita } from '@/types/gh'

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function getTodayRangeISO(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

type MetricCardProps = {
  label: string
  value: number | string
  icon: ElementType
  color: string
  bg: string
  border: string
  badge?: string
  onClick?: () => void
}

function MetricCard({ label, value, icon: Icon, color, bg, border, badge, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px 24px',
        background: 'var(--bg-surface)',
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = border }}
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
          {badge ? (
            <div style={{ display: 'inline-flex', marginTop: '8px', padding: '2px 8px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', color, fontFamily: 'var(--font-mono)' }}>
              {badge}
            </div>
          ) : null}
        </div>
        <div style={{ width: '40px', height: '40px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

function SesionActivaCard({ sesion, onClick }: { sesion: GhSesionInduccion; onClick: () => void }) {
  const checkinPct = sesion.total_asistentes > 0 ? Math.round((sesion.total_checkin / sesion.total_asistentes) * 100) : 0
  const checkoutPct = sesion.total_asistentes > 0 ? Math.round((sesion.total_checkout / sesion.total_asistentes) * 100) : 0
  const TipoIcon = sesion.tipo_sesion === 'VIRTUAL' ? Video : sesion.tipo_sesion === 'HIBRIDA' ? Wifi : Building2

  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#6366f1'
        el.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(99,102,241,0.18)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sesion.area}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {sesion.tipo_induccion} · #{sesion.id}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TipoIcon size={11} />
            {sesion.tipo_sesion}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <Users size={12} />
        {sesion.total_asistentes} asistente{sesion.total_asistentes !== 1 ? 's' : ''}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
          {formatTime(sesion.fecha_hora_inicio)} – {formatTime(sesion.fecha_hora_fin)}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Check-in</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{sesion.total_checkin}/{sesion.total_asistentes} — {checkinPct}%</span>
          </div>
          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ width: `${checkinPct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Check-out</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{sesion.total_checkout}/{sesion.total_asistentes} — {checkoutPct}%</span>
          </div>
          <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ width: `${checkoutPct}%`, height: '100%', background: '#0ea5e9', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
    </button>
  )
}

export default function GHDashboardView() {
  const navigate = useNavigate()
  const sedeActiva = useSedeStore((s) => s.sedeActiva)
  const sedeId = sedeActiva?.id ?? null
  const todayRange = useMemo(() => getTodayRangeISO(), [])

  const { data: dashboardMetrics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['gh', 'dashboard', sedeId],
    queryFn: () => ghService.getDashboard(sedeId as number),
    enabled: Boolean(sedeId),
  })

  const {
    data: citasHoy = [],
    isLoading: isLoadingCitas,
    isFetching: isFetchingCitas,
    refetch: refetchCitas,
  } = useQuery({
    queryKey: ['gh', 'dashboard-citas-hoy', sedeId],
    queryFn: () =>
      ghService.listarCitas({
        sede_id: sedeId as number,
        fecha_desde: todayRange.start,
        fecha_hasta: todayRange.end,
        page: 1,
        per_page: 100,
      }),
    enabled: Boolean(sedeId),
  })

  const { data: sesionesEnCurso = [] } = useQuery({
    queryKey: ['gh', 'inducciones', { estado_sesion: 'EN_CURSO', sede_id: sedeId }],
    queryFn: () => ghService.listarSesionesInduccion({ sede_id: sedeId as number, estado_sesion: 'EN_CURSO' }),
    enabled: Boolean(sedeId),
    refetchInterval: 60_000,
  })

  const metrics = useMemo(() => {
    if (dashboardMetrics) {
      return {
        citasHoy: dashboardMetrics.citas_hoy_total,
        confirmadas: dashboardMetrics.citas_hoy_confirmadas,
        noAsistio: dashboardMetrics.citas_hoy_no_asistio,
        enCurso: dashboardMetrics.citas_en_curso,
      }
    }
    return {
      citasHoy: citasHoy.length,
      confirmadas: citasHoy.filter((c) => c.estado === 'CONFIRMADA').length,
      noAsistio: citasHoy.filter((c) => c.estado === 'NO_ASISTIO').length,
      enCurso: citasHoy.filter((c) => c.estado === 'EN_CURSO').length,
    }
  }, [dashboardMetrics, citasHoy])

  const pendientes = Math.max(0, metrics.citasHoy - metrics.confirmadas - metrics.noAsistio - metrics.enCurso)
  const asistenciaPct = pct(metrics.confirmadas, metrics.citasHoy)
  const noShowPct = pct(metrics.noAsistio, metrics.citasHoy)

  const estadoData = useMemo(
    () => [
      { label: 'Confirmadas', value: metrics.confirmadas, color: 'var(--success-400)', bg: 'rgba(16,185,129,0.12)' },
      { label: 'En curso', value: metrics.enCurso, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
      { label: 'Pendientes', value: pendientes, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
      { label: 'No asistió', value: metrics.noAsistio, color: 'var(--danger-400)', bg: 'rgba(239,68,68,0.12)' },
    ],
    [metrics, pendientes],
  )

  const tiposBase: GhTipoCita[] = ['INDUCCION', 'FIRMA_CONTRATO', 'ENTREGA_DOTACION']

  const tipoData = useMemo(() => {
    const map = new Map<GhTipoCita, number>()
    for (const tipo of tiposBase) map.set(tipo, 0)
    for (const cita of citasHoy) map.set(cita.tipo_cita, (map.get(cita.tipo_cita) ?? 0) + 1)
    return tiposBase.map((tipo) => ({ tipo, value: map.get(tipo) ?? 0 }))
  }, [citasHoy])

  const proximasCitas = useMemo(() => {
    const now = new Date()
    return [...citasHoy]
      .filter((cita) => new Date(cita.fecha_hora_inicio) >= now && cita.estado !== 'CANCELADA')
      .sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())
      .slice(0, 8)
  }, [citasHoy])

  const kpisProxy = useMemo(
    () => ({
      conversionConfirmacion: pct(metrics.confirmadas, metrics.citasHoy),
      noShow: pct(metrics.noAsistio, metrics.citasHoy),
      operacionActiva: pct(metrics.enCurso + metrics.confirmadas, metrics.citasHoy),
    }),
    [metrics],
  )

  if (!sedeId) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Selecciona una sede para ver el dashboard GH.</div>

  if (isLoading || isLoadingCitas) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-default)', borderTop: '2px solid var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        Cargando métricas GH...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }} className="animate-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <UserCheck size={14} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>
              MÓDULO GH
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Dashboard Gestión Humana
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Agenda operativa de citas y asistencia — {sedeActiva?.nombre}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { void refetch(); void refetchCitas() }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
            {isFetching || isFetchingCitas ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            onClick={() => navigate('/gh/citas')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary-500)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-inverted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-glow-primary)' }}
          >
            <Plus size={14} />
            Agendar citas
          </button>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }} className="animate-fade-up stagger-1">
        <MetricCard label="Citas hoy" value={metrics.citasHoy} icon={CalendarDays} color="var(--primary-400)" bg="rgba(14,165,233,0.08)" border="rgba(14,165,233,0.2)" onClick={() => navigate('/gh/citas')} />
        <MetricCard label="Confirmadas" value={metrics.confirmadas} icon={CalendarCheck2} color="var(--success-400)" bg="rgba(16,185,129,0.08)" border="rgba(16,185,129,0.2)" badge={`${asistenciaPct}% asistencia`} />
        <MetricCard label="En curso" value={metrics.enCurso} icon={Clock3} color="#6366F1" bg="rgba(99,102,241,0.08)" border="rgba(99,102,241,0.2)" />
        <MetricCard label="No asistió" value={metrics.noAsistio} icon={CalendarX2} color="var(--danger-400)" bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.2)" badge={`${noShowPct}% inasistencia`} />
      </div>

      {/* ── Sesiones activas (EN_CURSO) ── */}
      {sesionesEnCurso.length > 0 && (
        <div
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(14,165,233,0.04))', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: '24px' }}
          className="animate-fade-up stagger-2"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Sesiones de inducción en curso ({sesionesEnCurso.length})
              </span>
            </div>
            <button
              onClick={() => navigate('/gh/inducciones')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Gestionar <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {sesionesEnCurso.map((sesion) => (
              <SesionActivaCard key={sesion.id} sesion={sesion} onClick={() => navigate('/gh/inducciones')} />
            ))}
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }} className="animate-fade-up stagger-2">
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Distribución de estado del día</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confirmadas, en curso, pendientes y no asistencias</div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {estadoData.map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                </div>
                <div style={{ height: '10px', borderRadius: '999px', background: item.bg, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(item.value, metrics.citasHoy)}%`, height: '100%', background: item.color, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }} className="animate-fade-up stagger-3">
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Citas por tipo (hoy)</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Distribución operativa por tipología GH</div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {tipoData.map((item) => (
              <div key={item.tipo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {item.tipo.replace('_', ' ').toLowerCase()}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                </div>
                <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(14,165,233,0.08)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(item.value, metrics.citasHoy)}%`, height: '100%', background: 'var(--primary-400)', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Próximas citas */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="animate-fade-up stagger-2">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={14} color="var(--primary-400)" />
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Próximas citas de hoy</span>
            </div>
            <button
              onClick={() => navigate('/gh/citas')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Ver todo <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {proximasCitas.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                No hay citas pendientes en el resto del día
              </div>
            ) : (
              proximasCitas.map((cita: GhCita) => (
                <div
                  key={cita.id}
                  style={{ padding: '11px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => navigate(`/gh/citas/${cita.id}`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {cita.candidato.nombres} {cita.candidato.apellidos}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                      {cita.tipo_cita.replace('_', ' ')} · {cita.codigo}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {formatTime(cita.fecha_hora_inicio)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--primary-400)', marginTop: '1px' }}>{cita.estado}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KPIs proxy */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }} className="animate-fade-up stagger-3">
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={14} color="var(--success-400)" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>KPIs operativos del día</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimados con datos actuales de la sede</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
            {[
              { label: 'Conversión a confirmación', value: `${kpisProxy.conversionConfirmacion}%`, color: 'var(--success-400)', bg: 'rgba(16,185,129,0.06)' },
              { label: 'Tasa de inasistencia', value: `${kpisProxy.noShow}%`, color: 'var(--danger-400)', bg: 'rgba(239,68,68,0.06)' },
              { label: 'Operación activa del día', value: `${kpisProxy.operacionActiva}%`, color: '#6366F1', bg: 'rgba(99,102,241,0.06)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', background: item.bg }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ color: item.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Basados en citas del día actual de la sede activa.
          </div>
        </div>

        {/* Accesos rápidos */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="animate-fade-up stagger-3">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Accesos rápidos GH</span>
          </div>
          <div style={{ padding: '12px' }}>
            {[
              { label: 'Agendar citas', desc: 'Listado y filtros operativos de citas', icon: CalendarDays, color: 'var(--primary-400)', bg: 'rgba(14,165,233,0.08)', path: '/gh/citas' },
              { label: 'Inducciones', desc: 'Sesiones sincrónicas y virtuales con control de asistencia', icon: UserCheck, color: 'var(--success-400)', bg: 'rgba(16,185,129,0.08)', path: '/gh/inducciones' },
              { label: 'Dotación', desc: 'Matriz por área, cargo y kit de entrega', icon: Briefcase, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', path: '/gh/dotacion' },
              { label: 'Importación GH', desc: 'Carga masiva de candidatos por sede', icon: Upload, color: '#6366F1', bg: 'rgba(99,102,241,0.08)', path: '/gh/importacion' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', marginBottom: '4px', transition: 'all var(--transition-fast)' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = item.bg; el.style.borderColor = 'var(--border-subtle)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent' }}
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
