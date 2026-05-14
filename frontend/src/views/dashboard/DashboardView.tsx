/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Dashboard principal — vista post-login adaptativa por rol.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Car, Cpu, Users, Activity,
  UserCheck, AlertTriangle, ArrowRight, UserX,
  LayoutGrid, ClipboardList, Eye, ClipboardCheck,
  CalendarDays, Briefcase, Upload, BookOpen,
} from 'lucide-react'
import { useAuthStore, useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { ghService } from '@/services/gh.service'
import type { DashboardHSEResponse } from '@/types/hse'
import type { GhDashboard } from '@/types/gh'

// ── Dashboard para roles HSE ──────────────────────────────────────
function HSEFocusedDashboard({
  metrics,
  canSeeVigilante,
  canManage,
}: {
  metrics:          DashboardHSEResponse | null
  canSeeVigilante:  boolean
  canManage:        boolean
}) {
  const navigate = useNavigate()

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
        <MetricBox label="Dentro ahora" value={metrics?.contratistas_dentro_ahora ?? '—'} color="var(--primary-400)" bg="rgba(69,116,196,0.08)" icon={Users} />
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

      {/* Accesos rápidos */}
      <div
        style={{
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
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
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background  = 'transparent'
                el.style.borderColor = 'transparent'
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

// ── Dashboard para ADMIN_GH ───────────────────────────────────────
function GHFocusedDashboard({
  metrics,
}: {
  metrics: GhDashboard | null
}) {
  const navigate = useNavigate()

  const accesos = [
    { label: 'Citas',       desc: 'Agenda operativa del día',               icon: CalendarDays, color: 'var(--primary-400)', bg: 'rgba(14,165,233,0.08)',    path: '/gh/citas' },
    { label: 'Inducciones', desc: 'Sesiones sincrónicas y control asistencia', icon: BookOpen,    color: 'var(--success-400)', bg: 'rgba(40,149,108,0.08)',   path: '/gh/inducciones' },
    { label: 'Dotación',    desc: 'Matriz de entrega por área y cargo',      icon: Briefcase,   color: '#f59e0b',             bg: 'rgba(245,158,11,0.08)',  path: '/gh/dotacion' },
    { label: 'Importación', desc: 'Carga masiva de candidatos por sede',      icon: Upload,      color: '#5668B8',             bg: 'rgba(86,104,184,0.08)', path: '/gh/importacion' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>

      {/* Métricas GH */}
      <div
        style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}
        className="animate-fade-up stagger-2"
      >
        <MetricBox label="Citas hoy"    value={metrics?.citas_hoy_total    ?? '—'} color="var(--primary-400)"  bg="rgba(14,165,233,0.08)"    icon={CalendarDays} />
        <MetricBox label="Confirmadas"  value={metrics?.citas_hoy_confirmadas ?? '—'} color="var(--success-400)" bg="rgba(40,149,108,0.08)"    icon={UserCheck} />
        <MetricBox label="En curso"     value={metrics?.citas_en_curso       ?? '—'} color="#5668B8"            bg="rgba(86,104,184,0.08)"   icon={Activity} />
        {(metrics?.citas_hoy_no_asistio ?? 0) > 0 && (
          <MetricBox label="No asistió" value={metrics!.citas_hoy_no_asistio} color="var(--danger-400)" bg="rgba(192,80,80,0.08)" icon={UserX} alert />
        )}
      </div>

      {/* Accesos rápidos */}
      <div
        style={{
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow:     'hidden',
        }}
        className="animate-fade-up stagger-3"
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Accesos rápidos — Gestión Humana
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
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background  = 'transparent'
                el.style.borderColor = 'transparent'
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
          borderRadius: 'var(--radius-lg)',
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
  icon:   React.ElementType
  alert?: boolean
}) {
  return (
    <div style={{
      padding:      '16px',
      background:   'var(--bg-surface)',
      border:       `1px solid ${alert ? color.replace(')', ', 0.3)').replace('var(', 'rgba(') : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)',
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
    }}>
      <div style={{
        width: '36px', height: '36px', background: bg,
        borderRadius: 'var(--radius-md)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
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

  const [hseMetrics, setHseMetrics] = useState<DashboardHSEResponse | null>(null)
  const [ghMetrics, setGhMetrics]   = useState<GhDashboard | null>(null)

  // Determinar rol predominante
  const esAdminGlobal      = isAdmin()
  const esAdminHSE         = hasAnyRole(['ADMIN_HSE'])
  const esGestionHSE       = hasAnyRole(['GESTION_HSE'])
  const esVigilanteHSE     = hasAnyRole(['VIGILANTE_HSE'])
  const esRolHSE           = esAdminHSE || esGestionHSE || esVigilanteHSE
  const esAdminGH          = hasAnyRole(['ADMIN_GH'])
  const esVigilanteParking = hasAnyRole(['VIGILANTE_PARKING'])

  useEffect(() => {
    if (!sedeActiva?.id) return
    hseService.getDashboard(sedeActiva.id)
      .then(setHseMetrics)
      .catch(() => {/* silencioso */})
  }, [sedeActiva?.id])

  useEffect(() => {
    if (!sedeActiva?.id || !esAdminGH) return
    ghService.getDashboard(sedeActiva.id)
      .then(setGhMetrics)
      .catch(() => {/* silencioso */})
  }, [sedeActiva?.id, esAdminGH])

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
          metrics={hseMetrics}
          canSeeVigilante={esAdminHSE || esVigilanteHSE}
          canManage={esAdminHSE || esGestionHSE}
        />
      </div>
    )
  }

  // ── Vista para ADMIN_GH ───────────────────────────────────────
  if (!esAdminGlobal && esAdminGH) {
    return (
      <div style={{ padding: '0', maxWidth: '1000px' }}>
        <div style={{ padding: '32px 32px 0', marginBottom: '24px' }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Users size={14} color="#EC4899" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#EC4899', letterSpacing: '0.12em' }}>
              MÓDULO GH · ADMIN GESTIÓN HUMANA
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Hola, <span style={{ color: '#EC4899' }}>{primerNombre}</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            KOAJ Access v2.0 — {sedeActiva?.nombre || 'Sin sede seleccionada'}
          </p>
        </div>
        <GHFocusedDashboard metrics={ghMetrics} />
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
    {
      icon:        Users,
      label:       'Gestión Humana',
      descripcion: 'Citas e integración Midassoft',
      color:       '#EC4899',
      bg:          'rgba(236,72,153,0.08)',
      border:      'rgba(236,72,153,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_GH','VISUALIZADOR']),
      disponible:  true,
      path:        '/gh',
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
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px',
          background: 'rgba(40,149,108,0.06)',
          border: '1px solid rgba(40,149,108,0.15)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '32px',
        }}
        className="animate-fade-up stagger-1"
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-400)', boxShadow: '0 0 8px var(--success-400)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.83rem', color: 'var(--success-400)', fontWeight: 500 }}>Sistema operativo</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '4px' }}>— Backend conectado · Auth verificado</span>
      </div>

      {/* Grid de módulos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {modulos.map((mod, i) => (
          <div
            key={mod.label}
            className={`animate-fade-up stagger-${i + 2}`}
            onClick={() => mod.disponible && mod.path && navigate(mod.path)}
            style={{
              padding: '24px', background: 'var(--bg-surface)',
              border: `1px solid ${mod.disponible ? mod.border : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              opacity: mod.disponible ? 1 : 0.5,
              cursor: mod.disponible ? 'pointer' : 'default',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { if (mod.disponible) (e.currentTarget as HTMLElement).style.borderColor = mod.color }}
            onMouseLeave={e => { if (mod.disponible) (e.currentTarget as HTMLElement).style.borderColor = mod.border }}
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
          style={{ marginTop: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
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
        style={{ marginTop: '20px', padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px' }}
        className="animate-fade-up stagger-6"
      >
        <div style={{ width: '36px', height: '36px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-400)', flexShrink: 0 }}>
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

