/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Reportes — Vista de resumen ejecutivo consolidado.
 *
 * Consume los dashboards existentes de HSE y GH para generar
 * un panel de resumen operativo por sede. No requiere endpoints
 * adicionales en el backend.
 */

import { useNavigate } from 'react-router-dom'
import {
  BarChart3, ShieldCheck, ArrowRight,
  TrendingUp, Activity, UserCheck, AlertTriangle,
  Clock3, RefreshCw,
  FileBarChart2, ClipboardCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSedeStore, useAuthStore } from '@/store'
import { hseService } from '@/services/hse.service'

// ── Tarjeta de resumen de módulo ─────────────────────────────────
function ModuleReportCard({
  title,
  icon: Icon,
  color,
  bg,
  border,
  stats,
  path,
  onNavigate,
}: {
  title:      string
  icon:       React.ElementType
  color:      string
  bg:         string
  border:     string
  stats:      { label: string; value: number | string; alert?: boolean }[]
  path:       string
  onNavigate: (path: string) => void
}) {
  return (
    <div
      style={{
        background:   'var(--bg-surface)',
        border:       `1px solid ${border}`,
        borderRadius: 'var(--radius-xl)',
        overflow:     'hidden',
        transition:   'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        boxShadow:    'var(--shadow-card)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', background: bg,
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <button
          onClick={() => onNavigate(path)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'transparent', border: 'none',
            color: color, fontSize: '0.73rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Ver módulo <ArrowRight size={11} />
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, padding: '16px 20px', gap: '8px' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: stat.alert && Number(stat.value) > 0 ? 'var(--danger-400)' : 'var(--text-primary)',
              lineHeight: 1, marginBottom: '4px',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {stat.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI Row ──────────────────────────────────────────────────────
function KpiRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
      fontSize: '0.8rem',
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>{value}</span>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function ReportesView() {
  const navigate    = useNavigate()
  const sedeActiva  = useSedeStore((s) => s.sedeActiva)
  const hasAnyRole  = useAuthStore((s) => s.hasAnyRole)
  const isAdmin     = useAuthStore((s) => s.isAdmin)
  const sedeId      = sedeActiva?.id ?? null

  const puedeVerHSE = isAdmin() || hasAnyRole(['ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE'])

  const { data: hse, isLoading, refetch: refetchHSE, isFetching } = useQuery({
    queryKey: ['reportes', 'hse', sedeId],
    queryFn:  () => hseService.getDashboard(sedeId as number),
    enabled:  Boolean(sedeId) && puedeVerHSE,
    staleTime: 60_000,
  })

  function handleRefresh() {
    if (puedeVerHSE) void refetchHSE()
  }

  // KPIs derivados HSE
  const totalHSE       = (hse?.autorizaciones_activas ?? 0) + (hse?.autorizaciones_pendientes ?? 0)
  const hseTasaActiva  = totalHSE > 0 ? Math.round(((hse?.autorizaciones_activas ?? 0) / totalHSE) * 100) : 0
  const hseAlertas     = hse?.alertas_activas ?? 0

  if (!sedeId) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Selecciona una sede para ver los reportes.
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }} className="animate-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <BarChart3 size={14} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>
              REPORTES OPERATIVOS
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Resumen ejecutivo
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Métricas en tiempo real — {sedeActiva?.nombre}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          {isFetching ? 'Actualizando...' : 'Actualizar todo'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-default)', borderTop: '2px solid var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Cargando reportes...
        </div>
      ) : (
        <>
          {/* ── Acceso rápido a submódulos de reporte ── */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }} className="animate-fade-up">
            <button
              onClick={() => navigate('/reportes/hse')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 18px',
                background: 'var(--bg-surface)',
                border: '1px solid rgba(40,149,108,0.3)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--success-400)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(40,149,108,0.04)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(40,149,108,0.3)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'
              }}
            >
              <div style={{ width: '32px', height: '32px', background: 'rgba(40,149,108,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileBarChart2 size={15} color="var(--success-400)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reportes HSE</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cumplimiento · Historial · Exportar Excel</div>
              </div>
              <ArrowRight size={14} color="var(--success-400)" style={{ marginLeft: '4px' }} />
            </button>
          </div>

          {/* ── Resúmenes de módulos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>

            {puedeVerHSE && (
              <ModuleReportCard
                title="Seguridad HSE"
                icon={ShieldCheck}
                color="var(--success-400)"
                bg="rgba(40,149,108,0.08)"
                border="rgba(40,149,108,0.15)"
                path="/hse"
                onNavigate={navigate}
                stats={[
                  { label: 'Activas',     value: hse?.autorizaciones_activas   ?? '—' },
                  { label: 'Revisión',    value: hse?.autorizaciones_pendientes ?? '—' },
                  { label: 'Dentro ahora', value: hse?.contratistas_dentro_ahora ?? '—' },
                  { label: 'Vencidas',    value: hse?.autorizaciones_vencidas   ?? 0, alert: true },
                ]}
              />
            )}

          </div>

          {/* ── KPIs consolidados ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

            {puedeVerHSE && (
              <div
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}
                className="animate-fade-up stagger-2"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <ShieldCheck size={14} color="var(--success-400)" />
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>KPIs — HSE</div>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <KpiRow
                    label="Tasa de autorización activa"
                    value={`${hseTasaActiva}%`}
                    color="var(--success-400)"
                  />
                  <KpiRow
                    label="Contratistas en sitio"
                    value={String(hse?.contratistas_dentro_ahora ?? 0)}
                    color="var(--primary-400)"
                  />
                  <KpiRow
                    label="Alertas activas"
                    value={String(hseAlertas)}
                    color={hseAlertas > 0 ? 'var(--danger-400)' : 'var(--text-muted)'}
                  />
                  <KpiRow
                    label="Autorizaciones vencidas"
                    value={String(hse?.autorizaciones_vencidas ?? 0)}
                    color={(hse?.autorizaciones_vencidas ?? 0) > 0 ? 'var(--danger-400)' : 'var(--text-muted)'}
                  />
                </div>
                <button
                  onClick={() => navigate('/hse')}
                  style={{
                    marginTop: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    padding: '8px', background: 'rgba(40,149,108,0.06)', border: '1px solid rgba(40,149,108,0.15)',
                    borderRadius: 'var(--radius-md)', color: 'var(--success-400)', fontSize: '0.75rem', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  }}
                >
                  <Activity size={12} /> Ir al dashboard HSE
                </button>
              </div>
            )}


            {/* Panel de estado general */}
            <div
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}
              className="animate-fade-up stagger-4"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={14} color="var(--primary-400)" />
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Estado operativo general</div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {/* HSE summary */}
                {puedeVerHSE && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <ShieldCheck size={14} color="var(--success-400)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>HSE</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {hse?.autorizaciones_activas ?? 0} activas · {hse?.contratistas_dentro_ahora ?? 0} en sitio
                      </div>
                    </div>
                    {hseAlertas > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--danger-400)', fontWeight: 600 }}>
                        <AlertTriangle size={11} /> {hseAlertas}
                      </div>
                    )}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: hseAlertas > 0 ? 'var(--danger-400)' : 'var(--success-400)',
                      flexShrink: 0,
                    }} />
                  </div>
                )}

                {/* Parking placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', opacity: 0.4 }}>
                  <UserCheck size={14} color="var(--primary-400)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>Parking</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Módulo en desarrollo</div>
                  </div>
                  <div style={{
                    padding: '2px 6px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                  }}>PRONTO</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', opacity: 0.4 }}>
                  <Clock3 size={14} color="#5668B8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>NFC — Activos</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Módulo en desarrollo</div>
                  </div>
                  <div style={{
                    padding: '2px 6px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                  }}>PRONTO</div>
                </div>
              </div>

              {/* Acceso directo — Reportes HSE */}
              {puedeVerHSE && (
                <button
                  onClick={() => navigate('/reportes/hse')}
                  style={{
                    marginTop: '14px', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px',
                    background: 'rgba(40,149,108,0.04)', border: '1px solid rgba(40,149,108,0.15)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--success-400)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(40,149,108,0.15)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardCheck size={13} color="var(--success-400)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Reporte de Cumplimiento
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                        Historial completo · Exportar Excel
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={13} color="var(--success-400)" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
