import { useNavigate } from 'react-router-dom'
import {
  Car, AlertTriangle, Clock, RefreshCw, Plus,
  FileText, Activity, ArrowRight, Building2,
  TrendingUp, ShieldCheck, LogIn, LogOut, BarChart3,
  CheckCircle2, Users2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, useSedeStore } from '@/store'
import { parkingService } from '@/services/parking.service'
import type { DashboardParkingZona, DashboardParkingAcceso } from '@/services/parking.service'

// ── Helpers ────────────────────────────────────────────────────────
function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatFechaCorta(iso: string): string {
  const d   = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

// ── Donut SVG ──────────────────────────────────────────────────────
function DonutChart({ value, max, size = 112 }: { value: number; max: number; size?: number }) {
  const p      = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const r      = (size - 14) / 2
  const circum = 2 * Math.PI * r
  const offset = circum - (p / 100) * circum
  const color  = p >= 90 ? '#EF4444' : p >= 70 ? '#F59E0B' : '#10B981'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circum} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
    </svg>
  )
}

// ── Skeleton base ──────────────────────────────────────────────────
function Sk({ w = '60%', h = '13px', r = 'var(--radius-sm)' }: { w?: string; h?: string; r?: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
}

// ── KPI Card ───────────────────────────────────────────────────────
interface KpiCardProps {
  label:    string
  value:    number | string
  sub?:     string
  icon:     React.ElementType
  color:    string
  bg:       string
  border:   string
  onClick?: () => void
  badge?:   string
  alert?:   boolean
}

function KpiCard({ label, value, sub, icon: Icon, color, bg, border, onClick, badge, alert }: KpiCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      style={{
        padding:      '22px 24px',
        background:   'var(--bg-surface)',
        border:       `1px solid ${alert ? 'rgba(239,68,68,0.35)' : border}`,
        borderRadius: 'var(--radius-xl)',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        position:     'relative',
        overflow:     'hidden',
        boxShadow:    alert ? '0 0 0 3px rgba(239,68,68,0.07), var(--shadow-card)' : 'var(--shadow-card)',
        outline:      'none',
      }}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLElement
        el.style.transform   = 'translateY(-3px)'
        el.style.boxShadow   = 'var(--shadow-lg)'
        el.style.borderColor = color
      }}
      onMouseLeave={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLElement
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = alert ? '0 0 0 3px rgba(239,68,68,0.07), var(--shadow-card)' : 'var(--shadow-card)'
        el.style.borderColor = alert ? 'rgba(239,68,68,0.35)' : border
      }}
    >
      {/* Glow fondo */}
      <div style={{
        position: 'absolute', top: '-24px', right: '-24px',
        width: '80px', height: '80px',
        background: bg, borderRadius: '50%',
        filter: 'blur(22px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', margin: '0 0 10px' }}>
            {label.toUpperCase()}
          </p>
          <div style={{
            fontSize: '2.1rem', fontWeight: 800, lineHeight: 1,
            fontFamily: 'var(--font-mono)',
            color: alert ? '#EF4444' : 'var(--text-primary)',
          }}>
            {value}
          </div>
          {sub && (
            <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
              {sub}
            </p>
          )}
          {badge && (
            <span style={{
              display: 'inline-flex', marginTop: '10px',
              padding: '3px 9px',
              background: bg, border: `1px solid ${border}`,
              borderRadius: 'var(--radius-full)',
              fontSize: '0.62rem', color, fontFamily: 'var(--font-mono)', fontWeight: 700,
              letterSpacing: '0.06em',
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{
          width: '42px', height: '42px', flexShrink: 0, marginLeft: '12px',
          background: bg, border: `1px solid ${border}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={19} color={color} />
        </div>
      </div>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div style={{
      padding: '22px 24px', background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <Sk w="52%" h="10px" /><div style={{ marginTop: '14px' }} />
      <Sk w="38%" h="34px" /><div style={{ marginTop: '10px' }} />
      <Sk w="65%" h="11px" />
    </div>
  )
}

// ── Ocupación Card ─────────────────────────────────────────────────
function OcupacionCard({ total, ocupados, disponibles, porcentaje, isLoading }: {
  total: number; ocupados: number; disponibles: number; porcentaje: number; isLoading: boolean
}) {
  const color = porcentaje >= 90 ? '#EF4444' : porcentaje >= 70 ? '#F59E0B' : '#10B981'

  if (isLoading) {
    return (
      <div style={{
        padding: '22px 24px', background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <Sk w="50%" h="10px" /><div style={{ marginTop: '20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="skeleton" style={{ width: '112px', height: '112px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Sk w="68%" h="34px" /><div style={{ marginTop: '12px' }} />
            <Sk w="90%" h="11px" /><div style={{ marginTop: '8px' }} />
            <Sk w="70%" h="11px" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '22px 24px', background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', margin: '0 0 20px' }}>
        OCUPACIÓN ACTUAL
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <DonutChart value={ocupados} max={total} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
              {porcentaje}%
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1, marginBottom: '5px' }}>
            {ocupados}
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{total}</span>
          </div>
          <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            cupos ocupados de {total} en total
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { label: 'Ocupados', val: ocupados, dot: color },
              { label: 'Disponibles', val: disponibles, dot: '#10B981' },
            ].map(({ label, val, dot }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.73rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', flex: 1 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Zonas Panel ────────────────────────────────────────────────────
function ZonasPanel({ zonas, isLoading, onConfig }: {
  zonas:     DashboardParkingZona[]
  isLoading: boolean
  onConfig:  () => void
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Zonas de parqueo</span>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Ocupación en tiempo real</p>
        </div>
        {!isLoading && (
          <span style={{
            fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            background: 'var(--bg-raised)', padding: '3px 8px',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)',
          }}>
            {zonas.length} zona{zonas.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Sk w="48%" h="12px" />
                <Sk w="22%" h="12px" />
              </div>
              <Sk w="100%" h="7px" r="999px" />
            </div>
          ))
        ) : zonas.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ opacity: 0.3, marginBottom: '10px' }}><Building2 size={26} color="var(--text-muted)" /></div>
            <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: '0 0 3px' }}>Sin zonas configuradas</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7, margin: 0 }}>
              Configura zonas desde el panel de administración
            </p>
          </div>
        ) : (
          zonas.map((z) => {
            const p = pct(z.ocupados, z.capacidad_total)
            const barColor = p >= 90 ? '#EF4444' : p >= 70 ? '#F59E0B' : '#10B981'
            return (
              <div key={z.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.79rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                    {z.nombre}
                  </span>
                  <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {z.ocupados}/{z.capacidad_total}
                  </span>
                </div>
                <div style={{ height: '7px', borderRadius: '999px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: barColor, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button
          onClick={onConfig}
          style={{
            width: '100%', padding: '10px',
            background: 'var(--gradient-primary)', border: 'none',
            borderRadius: 'var(--radius-md)', color: '#fff',
            fontSize: '0.79rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            fontFamily: 'var(--font-ui)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.20)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.88'; el.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}
        >
          <Plus size={14} /> Gestionar zonas y cupos
        </button>
      </div>
    </div>
  )
}

// ── Estado resultado badge ─────────────────────────────────────────
const RESULTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  AUTORIZADO:         { label: 'Autorizado',     color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  NO_AUTORIZADO:      { label: 'No autorizado',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  NO_REGISTRADO:      { label: 'No registrado',  color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
  VENCIDO:            { label: 'Vencido',        color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  SUSPENDIDO:         { label: 'Suspendido',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  CUPO_NO_DISPONIBLE: { label: 'Sin cupo',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  EXCEPCION:          { label: 'Excepción',      color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
}

// ── Actividad Feed ─────────────────────────────────────────────────
function ActividadFeed({ actividad, isLoading }: {
  actividad: DashboardParkingAcceso[]
  isLoading: boolean
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={15} color="var(--primary-400)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Actividad reciente
          </span>
        </div>
        {!isLoading && actividad.length > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Últimos {actividad.length} registros
          </span>
        )}
      </div>

      {/* Cabecera de columnas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 120px 100px 130px',
        padding: '9px 24px',
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.65rem', fontWeight: 700,
        color: 'var(--text-muted)', letterSpacing: '0.08em',
        gap: '8px',
      }}>
        <span>PLACA</span>
        <span>EVENTO</span>
        <span>ZONA / CUPO</span>
        <span>HORA</span>
        <span>RESULTADO</span>
      </div>

      {/* Filas */}
      {isLoading ? (
        Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 120px 100px 130px',
            gap: '8px', padding: '13px 24px',
            borderBottom: '1px solid var(--border-subtle)', alignItems: 'center',
          }}>
            <Sk w="60%" h="13px" />
            <Sk w="70%" h="13px" />
            <Sk w="55%" h="13px" />
            <Sk w="65%" h="13px" />
            <Sk w="90%" h="22px" r="999px" />
          </div>
        ))
      ) : actividad.length === 0 ? (
        <div style={{ padding: '52px 24px', textAlign: 'center' }}>
          <div style={{ opacity: 0.3, marginBottom: '14px' }}><Activity size={30} color="var(--text-muted)" /></div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', margin: '0 0 6px' }}>
            Sin actividad registrada
          </p>
          <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', opacity: 0.7, margin: 0 }}>
            Los accesos de vehículos aparecerán aquí en tiempo real
          </p>
        </div>
      ) : (
        actividad.map((a, i) => {
          const cfg      = RESULTADO_CFG[a.resultado] ?? RESULTADO_CFG['NO_REGISTRADO']
          const isEntrada = a.tipo_acceso === 'ENTRADA'
          const isLast   = i === actividad.length - 1
          return (
            <div
              key={a.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 120px 100px 130px',
                gap: '8px', padding: '13px 24px',
                borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                alignItems: 'center', transition: 'background 0.14s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Placa */}
              <div>
                <span style={{
                  padding: '4px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                  color: 'var(--text-primary)', letterSpacing: '0.05em',
                }}>
                  {a.placa}
                </span>
              </div>

              {/* Evento */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.79rem', color: isEntrada ? '#10B981' : 'var(--text-muted)' }}>
                {isEntrada ? <LogIn size={13} /> : <LogOut size={13} />}
                <span>{isEntrada ? 'Entrada' : 'Salida'}</span>
              </div>

              {/* Zona / Cupo */}
              <span style={{ fontSize: '0.79rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.zona ? (a.numero_cupo ? `${a.zona} · ${a.numero_cupo}` : a.zona) : '—'}
              </span>

              {/* Hora */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{formatHora(a.fecha_hora)}</div>
                <div style={{ fontSize: '0.67rem', marginTop: '2px' }}>{formatFechaCorta(a.fecha_hora)}</div>
              </div>

              {/* Estado */}
              <span style={{
                display: 'inline-flex', padding: '4px 10px',
                background: cfg.bg, borderRadius: 'var(--radius-full)',
                fontSize: '0.71rem', color: cfg.color, fontWeight: 600,
                whiteSpace: 'nowrap', maxWidth: '100%',
              }}>
                {cfg.label}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Empty: sin sede ────────────────────────────────────────────────
function NoSedeState() {
  return (
    <div style={{ padding: '48px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        maxWidth: '400px', width: '100%', padding: '48px 40px',
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', background: 'rgba(15,23,42,0.05)',
          borderRadius: 'var(--radius-xl)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-subtle)',
        }}>
          <Building2 size={24} color="var(--text-muted)" />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Sin sede seleccionada
        </h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Selecciona una sede en la barra superior para ver las métricas de parking en tiempo real.
        </p>
      </div>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────────────
export default function ParkingDashboardView() {
  const navigate   = useNavigate()
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const sedeId     = sedeActiva?.id ?? null
  const hasAnyRole = useAuthStore(s => s.hasAnyRole)
  const canManage  = hasAnyRole(['ADMIN_PARKING', 'GESTION_PARKING', 'ADMIN_GLOBAL'])

  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey:        ['parking', 'dashboard', sedeId],
    queryFn:         () => parkingService.getDashboard(sedeId as number),
    enabled:         Boolean(sedeId),
    refetchInterval: 60_000,
    staleTime:       30_000,
  })

  if (!sedeId) return <NoSedeState />

  const ocup     = data?.ocupacion_actual           ?? { total: 0, ocupados: 0, disponibles: 0, porcentaje: 0 }
  const pend     = data?.solicitudes_pendientes     ?? 0
  const autAct   = data?.autorizaciones_activas     ?? 0
  const autVenc  = data?.autorizaciones_por_vencer  ?? 0
  const novedad  = data?.novedades_activas          ?? 0
  const docs     = data?.documentos_por_vencer      ?? 0
  const vDentro  = data?.vehiculos_dentro           ?? 0
  const zonas    = data?.zonas                      ?? []
  const actividad = data?.actividad_reciente        ?? []

  const ACCESOS_RAPIDOS = [
    { label: 'Solicitudes',  desc: 'Gestionar permisos',          icon: FileText,      color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',   path: '/parking/solicitudes', visible: canManage },
    { label: 'Vehículos',    desc: 'Autorizaciones activas',      icon: Car,           color: '#10B981', bg: 'rgba(16,185,129,0.08)',   path: '/parking/vehiculos',   visible: true },
    { label: 'Portal vigilante', desc: 'Control de acceso',        icon: ShieldCheck,   color: '#0F172A', bg: 'rgba(15,23,42,0.08)',     path: '/vigilante/parking',   visible: true },
    { label: 'Novedades',    desc: 'Gestionar incidentes',        icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    path: '/parking/novedades',   visible: canManage },
    { label: 'Excepciones',  desc: 'Accesos especiales',          icon: Clock,         color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',   path: '/parking/excepciones', visible: canManage },
    { label: 'Reportes',     desc: 'Análisis y exportaciones',    icon: BarChart3,     color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',   path: '/parking/reportes',    visible: true },
  ].filter(a => a.visible)

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1440px' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div
        className="animate-fade-up"
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Car size={12} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--primary-400)', letterSpacing: '0.15em' }}>
              MÓDULO PARKING
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: '0 0 5px', lineHeight: 1.2 }}>
            Dashboard Operativo
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0 }}>
            Estado del parking en tiempo real — {sedeActiva.nombre}
          </p>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => void refetch()}
            aria-label="Actualizar datos"
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
              fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'background 0.15s ease, border-color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-raised)'; el.style.borderColor = 'var(--border-default)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-surface)'; el.style.borderColor = 'var(--border-subtle)' }}
          >
            <div style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none', display: 'flex' }}>
              <RefreshCw size={14} />
            </div>
            {isFetching ? 'Actualizando...' : 'Actualizar'}
          </button>

          {canManage && (
            <button
              onClick={() => navigate('/parking/excepciones')}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
                background: 'var(--gradient-primary)', border: 'none',
                borderRadius: 'var(--radius-md)', color: '#fff',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                boxShadow: '0 2px 8px rgba(15,23,42,0.20)',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.88'; el.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)' }}
            >
              <Plus size={15} /> Nueva excepción
            </button>
          )}

          {canManage && (
            <button
              onClick={() => navigate('/parking/reportes')}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-raised)'; el.style.borderColor = 'var(--border-default)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-surface)'; el.style.borderColor = 'var(--border-subtle)' }}
            >
              <TrendingUp size={14} /> Ver reportes
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs: fila 1 (Ocupación + 3 métricas) ────────────────────── */}
      <div
        className="animate-fade-up stagger-1"
        style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: '18px', marginBottom: '18px' }}
      >
        <OcupacionCard {...ocup} isLoading={isPending} />

        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Vehículos dentro ahora"
            value={vDentro}
            sub={vDentro === 0 ? 'Ningún vehículo activo' : `${vDentro} en instalaciones`}
            icon={Car}
            color="#0F172A"
            bg="rgba(15,23,42,0.07)"
            border="rgba(15,23,42,0.12)"
            badge={vDentro > 0 ? 'EN SITIO' : undefined}
          />
        )}

        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Autorizaciones activas"
            value={autAct}
            sub={autAct === 0 ? 'Sin autorizaciones vigentes' : `${autAct} permisos activos`}
            icon={CheckCircle2}
            color="#10B981"
            bg="rgba(16,185,129,0.08)"
            border="rgba(16,185,129,0.15)"
            badge={autVenc > 0 ? `${autVenc} por vencer` : undefined}
            onClick={canManage ? () => navigate('/parking/vehiculos') : undefined}
          />
        )}

        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Solicitudes pendientes"
            value={pend}
            sub={pend === 0 ? 'Sin solicitudes en cola' : `${pend} por revisar`}
            icon={FileText}
            color="#3B82F6"
            bg="rgba(59,130,246,0.08)"
            border="rgba(59,130,246,0.15)"
            badge={pend > 0 ? 'EN COLA' : undefined}
            onClick={canManage ? () => navigate('/parking/solicitudes') : undefined}
          />
        )}
      </div>

      {/* ── KPIs: fila 2 (Novedades + Docs + Autorizaciones por vencer + vehículos usuarios) ── */}
      <div
        className="animate-fade-up stagger-1"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '18px', marginBottom: '24px' }}
      >
        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Incidentes activos"
            value={novedad}
            sub={novedad === 0 ? 'Sin incidentes abiertos' : `${novedad} requieren atención`}
            icon={AlertTriangle}
            color={novedad > 0 ? '#EF4444' : 'var(--text-muted)'}
            bg={novedad > 0 ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)'}
            border={novedad > 0 ? 'rgba(239,68,68,0.15)' : 'var(--border-subtle)'}
            badge={novedad > 0 ? 'ACTIVOS' : undefined}
            alert={novedad > 0}
            onClick={canManage && novedad > 0 ? () => navigate('/parking/novedades') : undefined}
          />
        )}

        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Docs. por vencer"
            value={docs}
            sub={docs === 0 ? 'Documentos al día' : `Vencen en ≤ 30 días`}
            icon={Clock}
            color={docs > 0 ? '#F59E0B' : 'var(--text-muted)'}
            bg={docs > 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)'}
            border={docs > 0 ? 'rgba(245,158,11,0.15)' : 'var(--border-subtle)'}
            badge={docs > 0 ? `${docs} DOCS` : undefined}
            alert={docs > 0}
          />
        )}

        {isPending ? <KpiSkeleton /> : (
          <KpiCard
            label="Autorizaciones por vencer"
            value={autVenc}
            sub={autVenc === 0 ? 'Ninguna próxima a vencer' : `Vencen en ≤ 30 días`}
            icon={Users2}
            color={autVenc > 0 ? '#F59E0B' : 'var(--text-muted)'}
            bg={autVenc > 0 ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)'}
            border={autVenc > 0 ? 'rgba(245,158,11,0.15)' : 'var(--border-subtle)'}
            badge={autVenc > 0 ? `${autVenc} PRONTO` : undefined}
          />
        )}

        {/* Card de estado general */}
        {isPending ? <KpiSkeleton /> : (
          <div style={{
            padding: '22px 24px', background: 'var(--bg-surface)',
            border: `1px solid ${novedad === 0 && docs === 0 ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-24px', right: '-24px',
              width: '80px', height: '80px',
              background: novedad === 0 && docs === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
              borderRadius: '50%', filter: 'blur(22px)', pointerEvents: 'none',
            }} />
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.09em', margin: '0 0 10px' }}>
              ESTADO GENERAL
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                background: novedad === 0 && docs === 0 ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 0 3px ${novedad === 0 && docs === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {novedad === 0 && docs === 0 ? 'Operación normal' : 'Requiere atención'}
              </span>
            </div>
            <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {novedad === 0 && docs === 0
                ? 'Sin alertas activas en el sistema'
                : `${novedad > 0 ? `${novedad} incidente${novedad > 1 ? 's' : ''}` : ''} ${novedad > 0 && docs > 0 ? '·' : ''} ${docs > 0 ? `${docs} doc${docs > 1 ? 's' : ''} por vencer` : ''}`.trim()
              }
            </p>
          </div>
        )}
      </div>

      {/* ── Accesos rápidos ─────────────────────────────────────────── */}
      <div
        className="animate-fade-up stagger-2"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${ACCESOS_RAPIDOS.length}, 1fr)`, gap: '14px', marginBottom: '24px' }}
      >
        {ACCESOS_RAPIDOS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px',
              padding: '18px 16px', background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              minWidth: 0,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = item.color
              el.style.transform   = 'translateY(-2px)'
              el.style.boxShadow   = 'var(--shadow-lg)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--border-subtle)'
              el.style.transform   = 'translateY(0)'
              el.style.boxShadow   = 'var(--shadow-card)'
            }}
          >
            <div style={{
              width: '34px', height: '34px', background: item.bg,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <item.icon size={16} color={item.color} />
            </div>
            <div style={{ minWidth: 0, width: '100%' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
            <ArrowRight size={12} color="var(--text-muted)" style={{ marginTop: 'auto', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* ── Contenido principal: Actividad + Zonas ───────────────────── */}
      <div
        className="animate-fade-up stagger-3"
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}
      >
        <ActividadFeed actividad={actividad} isLoading={isPending} />
        <ZonasPanel zonas={zonas} isLoading={isPending} onConfig={() => navigate('/parking/cupos')} />
      </div>

    </div>
  )
}
