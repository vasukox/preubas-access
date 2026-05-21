/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Dashboard principal — vista post-login adaptativa por rol.
 */

import type { ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Car, Cpu, Users, Activity,
  UserCheck, AlertTriangle, ArrowRight, UserX,
  LayoutGrid, ClipboardList, Eye, ClipboardCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import type { DashboardHSEResponse, PersonaDentroResponse } from '@/types/hse'

function formatMinutos(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}


function PersonasDentroList({ dentro, isLoading }: { dentro: PersonaDentroResponse[]; isLoading: boolean }) {
  return (
    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Cargando personas dentro…
        </div>
      ) : dentro.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Users size={28} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: '12px' }} />
          <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sin contratistas dentro</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
            No hay registros de ingreso activos en esta sede
          </div>
        </div>
      ) : (
        dentro.map((p) => (
          <div
            key={p.contratista_id}
            style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: p.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(192,80,80,0.1)' : 'rgba(40,149,108,0.1)',
                border: `1px solid ${p.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(192,80,80,0.2)' : 'rgba(40,149,108,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600,
                color: p.tipo_contratista === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)',
              }}>
                {p.nombre.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.nombre}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {p.numero_documento}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                color: p.alerta_tiempo ? 'var(--danger-400)' : 'var(--text-secondary)',
                fontWeight: p.alerta_tiempo ? 600 : 400,
              }}>
                {formatMinutos(p.minutos_dentro)}
              </div>
              <div style={{
                fontSize: '0.68rem', marginTop: '2px',
                color: p.tipo_contratista === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)',
              }}>
                {p.tipo_contratista === 'ALTO_RIESGO' ? 'Alto riesgo' : 'Normal'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── Dashboard para roles HSE ──────────────────────────────────────
function HSEFocusedDashboard({
  sedeId,
  metrics,
  canSeeVigilante,
  canManage,
}: {
  sedeId:           number | undefined
  metrics:          DashboardHSEResponse | undefined
  canSeeVigilante:  boolean
  canManage:        boolean
}) {
  const navigate = useNavigate()

  const {
    data:      dentro = [],
    isPending: isPendingDentro,
    refetch:   refetchDentro,
  } = useQuery({
    queryKey: ['hse', 'personas-dentro', sedeId],
    queryFn:  () => hseService.getPersonasDentro(sedeId!),
    enabled:  Boolean(sedeId),
    refetchInterval: 30_000,
  })

  const accesos = [
    canManage && {
      label: 'Panel General',
      desc:  'Crear y gestionar autorizaciones',
      icon:  Eye,
      color: 'var(--primary-400)',
      bg:    'rgba(69,116,196,0.08)',
      path:  '/hse/panel-general',
    },
    canManage && {
      label: 'Gestión',
      desc:  'Revisar y aprobar solicitudes',
      icon:  ClipboardList,
      color: '#5668B8',
      bg:    'rgba(86,104,184,0.08)',
      path:  '/hse/gestion',
    },
    canSeeVigilante && {
      label: 'Vigilante',
      desc:  'Verificar acceso en portería',
      icon:  ShieldCheck,
      color: 'var(--success-400)',
      bg:    'rgba(40,149,108,0.08)',
      path:  '/hse/vigilante',
    },
    canManage && {
      label: 'Excepciones',
      desc:  'Pre-aprobados y casos especiales',
      icon:  AlertTriangle,
      color: 'var(--danger-400)',
      bg:    'rgba(192,80,80,0.08)',
      path:  '/hse/excepciones',
    },
    canManage && {
      label: 'Cumplimiento',
      desc:  'Seguimiento de normativas',
      icon:  ClipboardCheck,
      color: '#14B8A6',
      bg:    'rgba(20,184,166,0.08)',
      path:  '/hse/cumplimiento',
    },
  ].filter(Boolean) as { label: string; desc: string; icon: React.ElementType; color: string; bg: string; path: string }[]

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>

      {/* Métricas HSE */}
      <div
        style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}
        className="animate-fade-up stagger-2"
      >
        {canManage && (
          <MetricBox label="Activas" value={metrics?.autorizaciones_activas ?? '—'} color="var(--success-400)" bg="rgba(40,149,108,0.08)" icon={UserCheck} />
        )}
        {canManage && (
          <MetricBox label="En revisión" value={metrics?.autorizaciones_pendientes ?? '—'} color="#5668B8" bg="rgba(86,104,184,0.08)" icon={Activity} />
        )}
        <MetricBox
          label="Dentro ahora"
          value={metrics?.contratistas_dentro_ahora ?? dentro.length ?? '—'}
          color="var(--primary-400)"
          bg="rgba(69,116,196,0.08)"
          icon={Users}
        />
        {canManage && metrics && metrics.autorizaciones_vencidas > 0 && (
          <MetricBox
            label="Vencidas"
            value={metrics.autorizaciones_vencidas}
            color="var(--danger-400)"
            bg="rgba(192,80,80,0.08)"
            icon={UserX}
            alert
          />
        )}
        {(metrics?.alertas_activas ?? 0) > 0 && (
          <MetricBox label="Alertas" value={metrics!.alertas_activas} color="var(--danger-400)" bg="rgba(192,80,80,0.08)" icon={AlertTriangle} alert />
        )}
      </div>

      {/* Personas dentro ahora */}
      <div
        style={{
          marginBottom: '24px',
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow:     'hidden',
        }}
        className="animate-fade-up stagger-3"
      >
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color="var(--success-400)" />
            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Personas dentro ahora
            </span>
            {dentro.length > 0 && (
              <span style={{
                padding: '1px 8px', background: 'rgba(40,149,108,0.1)',
                border: '1px solid rgba(40,149,108,0.2)', borderRadius: '20px',
                fontSize: '0.7rem', color: 'var(--success-400)', fontFamily: 'var(--font-mono)',
              }}>
                {dentro.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => void refetchDentro()}
              style={{
                padding: '6px 10px', background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-ui)',
              }}
            >
              Actualizar
            </button>
            {canSeeVigilante && (
              <button
                type="button"
                onClick={() => navigate('/hse/vigilante')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent',
                  border: 'none', color: 'var(--primary-500)', fontSize: '0.75rem',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600,
                }}
              >
                Portería <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
        <PersonasDentroList dentro={dentro} isLoading={isPendingDentro} />
      </div>

      {/* Accesos rápidos */}
      <div
        style={{
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow:     'hidden',
        }}
        className="animate-fade-up stagger-3"
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Accesos rápidos — HSE
          </span>
        </div>
        <div style={{ padding: '8px' }}>
          {accesos.map((item) => (
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
                transition:   'all var(--transition-fast)',
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
              <div style={{
                width: '36px', height: '36px', background: item.bg,
                borderRadius: 'var(--radius-md)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
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
  )
}

// ── Dashboard para VIGILANTE_PARKING ─────────────────────────────
function ParkingVigilanteDashboard() {
  return (
    <div style={{ padding: '32px', maxWidth: '700px' }}>
      <div
        style={{
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow:     'hidden',
        }}
        className="animate-fade-up stagger-2"
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Portería Parking — Acciones disponibles
          </span>
        </div>
        <div style={{ padding: '8px' }}>
          {[
            { label: 'Registrar ingreso',  desc: 'Escanear placa o buscar vehículo para entrada', icon: ArrowRight,     color: 'var(--success-400)', bg: 'rgba(40,149,108,0.08)',  available: false },
            { label: 'Registrar salida',   desc: 'Marcar salida de vehículo del parqueadero',     icon: Car,           color: 'var(--primary-400)', bg: 'rgba(14,165,233,0.08)',  available: false },
            { label: 'Consulta rápida',    desc: 'Verificar estado de un vehículo por placa',     icon: ClipboardCheck, color: '#5668B8',             bg: 'rgba(86,104,184,0.08)', available: false },
            { label: 'Parqueadero',        desc: 'Panel del módulo Parking',                       icon: Car,           color: '#f59e0b',             bg: 'rgba(245,158,11,0.08)', available: false },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                width:        '100%',
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                padding:      '12px',
                opacity:      0.5,
                cursor:       'default',
                marginBottom: '4px',
              }}
            >
              <div style={{
                width: '36px', height: '36px', background: item.bg,
                borderRadius: 'var(--radius-md)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <item.icon size={16} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{item.desc}</div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
              }}>
                PRÓXIMAMENTE
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-muted)',
        }}
        className="animate-fade-up stagger-3"
      >
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>Módulo Parking en desarrollo.</span>{' '}
        La portería de parqueadero estará disponible en el próximo sprint. Contacta al administrador si necesitas acceso urgente.
      </div>
    </div>
  )
}

// ── Métrica compacta ──────────────────────────────────────────────
function MetricBox({
  label, value, color, bg, icon: Icon, alert,
}: {
  label:  string
  value:  number | string
  color:  string
  bg:     string
  icon:   ElementType
  alert?: boolean
}) {
  return (
    <div style={{
      padding:      '16px',
      background:   'var(--bg-surface)',
      border:       `1px solid ${alert ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      boxShadow:    alert ? '0 1px 3px rgba(239,68,68,0.08), 0 4px 16px rgba(239,68,68,0.05)' : 'var(--shadow-card)',
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
      transition:   'transform var(--transition-base), box-shadow var(--transition-base)',
    }}>
      <div style={{
        width: '38px', height: '38px', background: bg,
        borderRadius: 'var(--radius-md)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: `1px solid ${alert ? 'rgba(239,68,68,0.15)' : 'transparent'}`,
      }}>
        <Icon size={17} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }} className="animate-count">
          {value}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.02em' }}>{label}</div>
      </div>
    </div>
  )
}

// ── Dashboard principal (ADMIN_GLOBAL) ────────────────────────────
export default function DashboardView() {
  const navigate     = useNavigate()
  const usuario      = useAuthStore((s) => s.usuario)
  const hasAnyRole   = useAuthStore((s) => s.hasAnyRole)
  const isAdmin      = useAuthStore((s) => s.isAdmin)
  const sedeActiva   = useSedeStore((s) => s.sedeActiva)

  // Determinar rol predominante
  const esAdminGlobal      = isAdmin()
  const esAdminHSE         = hasAnyRole(['ADMIN_HSE'])
  const esGestionHSE       = hasAnyRole(['GESTION_HSE'])
  const esVigilanteHSE     = hasAnyRole(['VIGILANTE_HSE'])
  const esRolHSE           = esAdminHSE || esGestionHSE || esVigilanteHSE
  const esVigilanteParking = hasAnyRole(['VIGILANTE_PARKING'])

  const { data: hseMetrics } = useQuery({
    queryKey: ['hse', 'dashboard', sedeActiva?.id],
    queryFn:  () => hseService.getDashboard(sedeActiva!.id),
    enabled:  Boolean(sedeActiva?.id),
  })

  const primerNombre = usuario?.nombre_completo?.split(' ')[0] || 'Usuario'

  // ── Vista para roles HSE (no admin global) ────────────────────
  if (!esAdminGlobal && esRolHSE) {
    const rolLabel = esAdminHSE ? 'Admin HSE' : esGestionHSE ? 'Gestión HSE' : 'Vigilante HSE'

    return (
      <div style={{ padding: '0', maxWidth: '1000px' }}>
        <div style={{ padding: '32px 32px 0', marginBottom: '24px' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={14} color="var(--success-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--success-400)', letterSpacing: '0.12em' }}>
              MÓDULO HSE · {rolLabel.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Hola, <span style={{ color: 'var(--primary-400)' }}>{primerNombre}</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            KOAJ Access v2.0 — {sedeActiva?.nombre || 'Sin sede seleccionada'}
          </p>
        </div>
        <HSEFocusedDashboard
          sedeId={sedeActiva?.id}
          metrics={hseMetrics}
          canSeeVigilante={esAdminHSE || esVigilanteHSE}
          canManage={esAdminHSE || esGestionHSE}
        />
      </div>
    )
  }

  // ── Vista para VIGILANTE_PARKING ──────────────────────────────
  if (!esAdminGlobal && esVigilanteParking) {
    return (
      <div style={{ padding: '0', maxWidth: '1000px' }}>
        <div style={{ padding: '32px 32px 0', marginBottom: '24px' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Car size={14} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>
              MÓDULO PARKING · VIGILANTE PORTERÍA
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Hola, <span style={{ color: 'var(--primary-400)' }}>{primerNombre}</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            KOAJ Access v2.0 — {sedeActiva?.nombre || 'Sin sede seleccionada'}
          </p>
        </div>
        <ParkingVigilanteDashboard />
      </div>
    )
  }

  // ── Vista General (ADMIN_GLOBAL o Roles Restantes) ────────────
  const modulos = [
    {
      icon:        ShieldCheck,
      label:       'HSE',
      descripcion: 'Autorizaciones y control de acceso',
      color:       'var(--success-400)',
      bg:          'rgba(40,149,108,0.08)',
      border:      'rgba(40,149,108,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_HSE','GESTION_HSE','VIGILANTE_HSE','VISUALIZADOR']),
      disponible:  true,
      path:        '/hse',
    },
    {
      icon:        Car,
      label:       'Parking',
      descripcion: 'Vehículos, LPR y autogestión',
      color:       'var(--primary-400)',
      bg:          'rgba(69,116,196,0.08)',
      border:      'rgba(69,116,196,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_PARKING','VIGILANTE_PARKING','VISUALIZADOR']),
      disponible:  false,
      path:        null,
    },
    {
      icon:        Cpu,
      label:       'NFC',
      descripcion: 'Activos e inventario con chips',
      color:       '#5668B8',
      bg:          'rgba(86,104,184,0.08)',
      border:      'rgba(86,104,184,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_NFC','VISUALIZADOR']),
      disponible:  false,
      path:        null,
    },
  ].filter(mod => mod.visible)

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Activity size={16} color="var(--primary-500)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary-500)', letterSpacing: '0.12em' }}>
            PANEL PRINCIPAL
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Bienvenido,{' '}
          <span style={{ color: 'var(--primary-400)' }}>
            {usuario?.nombre_completo?.split(' ')[0] || 'Usuario'}
          </span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          KOAJ Access v2.0 — Sistema de control de accesos Permoda S.A.S.
        </p>
      </div>

      {/* Estado del sistema */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '12px 18px',
          background:   'rgba(16, 185, 129, 0.05)',
          border:       '1px solid rgba(16, 185, 129, 0.18)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '32px',
          boxShadow:    '0 1px 3px rgba(16,185,129,0.06)',
        }}
        className="animate-fade-up stagger-1"
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-500)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--success-500)', opacity: 0.4, animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
        </div>
        <span style={{ fontSize: '0.83rem', color: 'var(--success-700)', fontWeight: 600 }}>Sistema operativo</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>— Backend conectado · Auth verificado</span>
      </div>

      {/* Grid de módulos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {modulos.map((mod, i) => (
          <div
            key={mod.label}
            className={`animate-fade-up stagger-${i + 2}`}
            onClick={() => mod.disponible && mod.path && navigate(mod.path)}
            style={{
              padding:      '24px',
              background:   'var(--bg-surface)',
              border:       `1px solid ${mod.disponible ? mod.border : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-xl)',
              boxShadow:    mod.disponible ? 'var(--shadow-card)' : 'none',
              opacity:      mod.disponible ? 1 : 0.5,
              cursor:       mod.disponible ? 'pointer' : 'default',
              transition:   'all var(--transition-base)',
            }}
            onMouseEnter={e => {
              if (mod.disponible) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = mod.color
                el.style.boxShadow   = 'var(--shadow-lg)'
                el.style.transform   = 'translateY(-2px)'
              }
            }}
            onMouseLeave={e => {
              if (mod.disponible) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = mod.border
                el.style.boxShadow   = 'var(--shadow-card)'
                el.style.transform   = 'translateY(0)'
              }
            }}
          >
            <div style={{
              width: '42px', height: '42px', background: mod.bg,
              border: `1px solid ${mod.border}`, borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}>
              <mod.icon size={20} color={mod.color} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {mod.label}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {mod.descripcion}
            </div>
            {mod.disponible ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.73rem', color: mod.color, fontWeight: 500 }}>
                Abrir módulo <ArrowRight size={12} />
              </div>
            ) : (
              <div style={{
                display: 'inline-flex', alignItems: 'center', marginTop: '12px',
                padding: '3px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
              }}>
                EN DESARROLLO
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen HSE */}
      {(esAdminGlobal || hasAnyRole(['VISUALIZADOR', 'ADMIN_HSE', 'GESTION_HSE'])) && (
        <div
          style={{ marginTop: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}
          className="animate-fade-up stagger-5"
        >
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={14} color="var(--success-400)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--success-400)', letterSpacing: '0.1em' }}>HSE</span>
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>Resumen operativo</span>
            </div>
            <button
              onClick={() => navigate('/hse')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--success-400)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
            >
              Ver dashboard <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '16px 20px', gap: '12px' }}>
            {[
              { label: 'Activas',      value: hseMetrics?.autorizaciones_activas   ?? '—', icon: UserCheck,     color: 'var(--success-400)', bg: 'rgba(40,149,108,0.08)' },
              { label: 'En revisión',  value: hseMetrics?.autorizaciones_pendientes ?? '—', icon: LayoutGrid,    color: '#5668B8',             bg: 'rgba(86,104,184,0.08)' },
              { label: 'Dentro ahora', value: hseMetrics?.contratistas_dentro_ahora ?? '—', icon: Users,         color: 'var(--primary-400)',  bg: 'rgba(69,116,196,0.08)' },
              { label: 'Alertas',      value: hseMetrics?.alertas_activas           ?? '—', icon: AlertTriangle, color: hseMetrics?.alertas_activas ? 'var(--danger-400)' : 'var(--text-muted)', bg: hseMetrics?.alertas_activas ? 'rgba(192,80,80,0.08)' : 'var(--bg-elevated)' },
            ].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: stat.bg, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <stat.icon size={16} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {hseMetrics && hseMetrics.autorizaciones_vencidas > 0 && (
            <div style={{
              margin: '0 20px 16px', padding: '10px 14px',
              background: 'rgba(192,80,80,0.06)', border: '1px solid rgba(192,80,80,0.15)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <UserX size={13} color="var(--danger-400)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--danger-400)', fontWeight: 500 }}>
                {hseMetrics.autorizaciones_vencidas} autorización{hseMetrics.autorizaciones_vencidas > 1 ? 'es' : ''} vencida{hseMetrics.autorizaciones_vencidas > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => navigate('/hse/gestion')}
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--danger-400)', fontSize: '0.73rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Gestionar <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info usuario */}
      <div
        style={{ marginTop: '20px', padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '12px' }}
        className="animate-fade-up stagger-6"
      >
        <div style={{ width: '36px', height: '36px', background: 'var(--gradient-brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.22)' }}>
          {usuario?.nombre_completo?.charAt(0) || 'U'}
        </div>
        <div>
          <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>{usuario?.nombre_completo}</div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{usuario?.roles?.map((r) => r.nombre).join(', ')}</div>
        </div>
      </div>
    </div>
  )
}

