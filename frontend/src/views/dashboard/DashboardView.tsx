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
} from 'lucide-react'
import { useAuthStore, useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import type { DashboardHSEResponse } from '@/types/hse'

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
      bg:    'rgba(245,158,11,0.08)',
      path:  '/hse/panel-general',
    },
    canManage && {
      label: 'Gestión',
      desc:  'Revisar y aprobar solicitudes',
      icon:  ClipboardList,
      color: '#6366F1',
      bg:    'rgba(99,102,241,0.08)',
      path:  '/hse/gestion',
    },
    canSeeVigilante && {
      label: 'Vigilante',
      desc:  'Verificar acceso en portería',
      icon:  ShieldCheck,
      color: 'var(--success-400)',
      bg:    'rgba(16,185,129,0.08)',
      path:  '/hse/vigilante',
    },
    canManage && {
      label: 'Excepciones',
      desc:  'Pre-aprobados y casos especiales',
      icon:  AlertTriangle,
      color: 'var(--danger-400)',
      bg:    'rgba(239,68,68,0.08)',
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
          <MetricBox label="Activas" value={metrics?.autorizaciones_activas ?? '—'} color="var(--success-400)" bg="rgba(16,185,129,0.08)" icon={UserCheck} />
        )}
        {canManage && (
          <MetricBox label="En revisión" value={metrics?.autorizaciones_pendientes ?? '—'} color="#6366F1" bg="rgba(99,102,241,0.08)" icon={Activity} />
        )}
        <MetricBox label="Dentro ahora" value={metrics?.contratistas_dentro_ahora ?? '—'} color="var(--primary-400)" bg="rgba(245,158,11,0.08)" icon={Users} />
        {canManage && metrics && metrics.autorizaciones_vencidas > 0 && (
          <MetricBox
            label="Vencidas"
            value={metrics.autorizaciones_vencidas}
            color="var(--danger-400)"
            bg="rgba(239,68,68,0.08)"
            icon={UserX}
            alert
          />
        )}
        {(metrics?.alertas_activas ?? 0) > 0 && (
          <MetricBox label="Alertas" value={metrics!.alertas_activas} color="var(--danger-400)" bg="rgba(239,68,68,0.08)" icon={AlertTriangle} alert />
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

  // Determinar rol predominante
  const esAdminGlobal   = isAdmin()
  const esAdminHSE      = hasAnyRole(['ADMIN_HSE'])
  const esGestionHSE    = hasAnyRole(['GESTION_HSE'])
  const esVigilanteHSE  = hasAnyRole(['VIGILANTE_HSE'])
  const esRolHSE        = esAdminHSE || esGestionHSE || esVigilanteHSE

  useEffect(() => {
    if (!sedeActiva?.id) return
    hseService.getDashboard(sedeActiva.id)
      .then(setHseMetrics)
      .catch(() => {/* silencioso */})
  }, [sedeActiva?.id])

  // ── Vista para roles HSE (no admin global) ────────────────────
  if (!esAdminGlobal && esRolHSE) {
    const primerNombre = usuario?.nombre_completo?.split(' ')[0] || 'Usuario'
    const rolLabel = esAdminHSE ? 'Admin HSE' : esGestionHSE ? 'Gestión HSE' : 'Vigilante HSE'

    return (
      <div style={{ padding: '0', maxWidth: '1000px' }}>
        {/* Header rol HSE */}
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

  // ── Vista General (ADMIN_GLOBAL o Roles Restantes) ────────────
  const modulos = [
    {
      icon:        ShieldCheck,
      label:       'HSE',
      descripcion: 'Autorizaciones y control de acceso',
      color:       'var(--success-400)',
      bg:          'rgba(16,185,129,0.08)',
      border:      'rgba(16,185,129,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_HSE','GESTION_HSE','VIGILANTE_HSE','VISUALIZADOR']),
      disponible:  true,
      path:        '/hse',
    },
    {
      icon:        Car,
      label:       'Parking',
      descripcion: 'Vehículos, LPR y autogestión',
      color:       'var(--primary-400)',
      bg:          'rgba(245,158,11,0.08)',
      border:      'rgba(245,158,11,0.15)',
      visible:     esAdminGlobal || hasAnyRole(['ADMIN_PARKING','VIGILANTE_PARKING','VISUALIZADOR']),
      disponible:  false,
      path:        null,
    },
    {
      icon:        Cpu,
      label:       'NFC',
      descripcion: 'Activos e inventario con chips',
      color:       '#6366F1',
      bg:          'rgba(99,102,241,0.08)',
      border:      'rgba(99,102,241,0.15)',
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
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
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
              { label: 'Activas',      value: hseMetrics?.autorizaciones_activas   ?? '—', icon: UserCheck,     color: 'var(--success-400)', bg: 'rgba(16,185,129,0.08)' },
              { label: 'En revisión',  value: hseMetrics?.autorizaciones_pendientes ?? '—', icon: LayoutGrid,    color: '#6366F1',             bg: 'rgba(99,102,241,0.08)' },
              { label: 'Dentro ahora', value: hseMetrics?.contratistas_dentro_ahora ?? '—', icon: Users,         color: 'var(--primary-400)',  bg: 'rgba(245,158,11,0.08)' },
              { label: 'Alertas',      value: hseMetrics?.alertas_activas           ?? '—', icon: AlertTriangle, color: hseMetrics?.alertas_activas ? 'var(--danger-400)' : 'var(--text-muted)', bg: hseMetrics?.alertas_activas ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)' },
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
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
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
