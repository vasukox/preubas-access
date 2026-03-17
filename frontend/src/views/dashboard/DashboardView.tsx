/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Dashboard principal — vista post-login.
 * Se irá enriqueciendo módulo a módulo.
 */

import { ShieldCheck, Car, Cpu, Users, Activity } from 'lucide-react'
import { useAuthStore } from '@/store'

export default function DashboardView() {
  const usuario = useAuthStore((s) => s.usuario)

  const modulos = [
    {
      icon:        ShieldCheck,
      label:       'HSE',
      descripcion: 'Autorizaciones y control de acceso',
      color:       'var(--success-400)',
      bg:          'rgba(16,185,129,0.08)',
      border:      'rgba(16,185,129,0.15)',
      disponible:  false,
    },
    {
      icon:        Car,
      label:       'Parking',
      descripcion: 'Vehículos, LPR y autogestión',
      color:       'var(--primary-400)',
      bg:          'rgba(245,158,11,0.08)',
      border:      'rgba(245,158,11,0.15)',
      disponible:  false,
    },
    {
      icon:        Cpu,
      label:       'NFC',
      descripcion: 'Activos e inventario con chips',
      color:       '#6366F1',
      bg:          'rgba(99,102,241,0.08)',
      border:      'rgba(99,102,241,0.15)',
      disponible:  false,
    },
    {
      icon:        Users,
      label:       'Gestión Humana',
      descripcion: 'Citas e integración Midassoft',
      color:       '#EC4899',
      bg:          'rgba(236,72,153,0.08)',
      border:      'rgba(236,72,153,0.15)',
      disponible:  false,
    },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Activity size={16} color="var(--primary-500)" />
          <span
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.7rem',
              color:         'var(--primary-500)',
              letterSpacing: '0.12em',
            }}
          >
            PANEL PRINCIPAL
          </span>
        </div>
        <h1
          style={{
            fontSize:      '1.75rem',
            fontWeight:    700,
            color:         'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom:  '6px',
          }}
        >
          Bienvenido,{' '}
          <span style={{ color: 'var(--primary-400)' }}>
            {usuario?.nombre_completo?.split(' ')[0] ?? 'Usuario'}
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
          padding:      '14px 20px',
          background:   'rgba(16,185,129,0.06)',
          border:       '1px solid rgba(16,185,129,0.15)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '32px',
        }}
        className="animate-fade-up stagger-1"
      >
        <div
          style={{
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   'var(--success-400)',
            boxShadow:    '0 0 8px var(--success-400)',
            flexShrink:   0,
          }}
        />
        <span style={{ fontSize: '0.83rem', color: 'var(--success-400)', fontWeight: 500 }}>
          Sistema operativo
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
          — Backend conectado · Auth verificado
        </span>
      </div>

      {/* Grid de módulos */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap:                 '16px',
        }}
      >
        {modulos.map((mod, i) => (
          <div
            key={mod.label}
            className={`animate-fade-up stagger-${i + 2}`}
            style={{
              padding:      '24px',
              background:   'var(--bg-surface)',
              border:       `1px solid var(--border-subtle)`,
              borderRadius: 'var(--radius-lg)',
              opacity:      mod.disponible ? 1 : 0.5,
              cursor:       mod.disponible ? 'pointer' : 'default',
              transition:   'all var(--transition-fast)',
            }}
          >
            <div
              style={{
                width:          '42px',
                height:         '42px',
                background:     mod.bg,
                border:         `1px solid ${mod.border}`,
                borderRadius:   'var(--radius-md)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                marginBottom:   '16px',
              }}
            >
              <mod.icon size={20} color={mod.color} />
            </div>
            <div
              style={{
                fontSize:     '1rem',
                fontWeight:   600,
                color:        'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              {mod.label}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {mod.descripcion}
            </div>
            {!mod.disponible && (
              <div
                style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  marginTop:    '12px',
                  padding:      '3px 8px',
                  background:   'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize:     '0.68rem',
                  color:        'var(--text-muted)',
                  fontFamily:   'var(--font-mono)',
                  letterSpacing: '0.05em',
                }}
              >
                EN DESARROLLO
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info usuario */}
      <div
        style={{
          marginTop:    '32px',
          padding:      '16px 20px',
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
        }}
        className="animate-fade-up stagger-5"
      >
        <div
          style={{
            width:          '36px',
            height:         '36px',
            background:     'var(--bg-elevated)',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '0.9rem',
            fontWeight:     600,
            color:          'var(--primary-400)',
            flexShrink:     0,
          }}
        >
          {usuario?.nombre_completo?.charAt(0) ?? 'U'}
        </div>
        <div>
          <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {usuario?.nombre_completo}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            {usuario?.roles?.map((r) => r.nombre).join(', ')}
          </div>
        </div>
      </div>
    </div>
  )
}