import { ChevronLeft, ShieldAlert, UserCheck } from 'lucide-react'
import type { RolSistema } from '@/services/herramientas.service'
import {
  HSE_ROLES_ACTIVOS,
  HSE_SUBMODULO_ROLES,
  badgeColor,
  type VistaHerramientas,
} from '../constants'

interface RolesPanelProps {
  roles: RolSistema[]
  setVistaActiva: (vista: VistaHerramientas) => void
}

export function RolesPanel({ roles, setVistaActiva }: RolesPanelProps) {
  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderColor: 'transparent',
    background: 'var(--bg-raised)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <div className="animate-fade-up stagger-2" style={panelStyle}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Catálogo de roles
          </span>
        </div>
        <button
          onClick={() => setVistaActiva('inicio')}
          className="btn-ghost"
          style={backButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
        >
          <ChevronLeft size={14} />
          Volver al Inicio
        </button>
      </div>

      <div
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          background: 'rgba(0,0,0,0.015)',
        }}
      >
        {roles.map((r) => {
          const rColor = r.color || '#6B7280';
          return (
          <div
            key={r.id}
            style={{
              position: 'relative',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.15)'
              e.currentTarget.style.borderColor = rColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: rColor }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: rColor,
                  background: `rgba(${parseInt(rColor.slice(1,3),16)}, ${parseInt(rColor.slice(3,5),16)}, ${parseInt(rColor.slice(5,7),16)}, 0.1)`,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: `1px solid rgba(${parseInt(rColor.slice(1,3),16)}, ${parseInt(rColor.slice(3,5),16)}, ${parseInt(rColor.slice(5,7),16)}, 0.2)`,
                }}
              >
                {r.nombre.replace('ADMIN_', 'ADM_')}
              </span>
              <ShieldAlert size={14} color={rColor} style={{ opacity: 0.5 }} />
            </div>
            
            <p
              style={{
                margin: '4px 0',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                flexGrow: 1,
              }}
            >
              {r.descripcion}
            </p>

            <div style={{ background: 'var(--bg-raised)', padding: '12px', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                Alcance Modular
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {(r.grupos ?? []).map((g, idx) => (
                  <div
                    key={`cat-grp-${r.id}-${idx}`}
                    style={{ fontSize: '0.74rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}
                  >
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: rColor, marginTop: '7px' }} />
                    <div style={{ flex: 1, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{g.grupo}</span> <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({g.modulo})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )})}
      </div>

      <div
        style={{
          padding: '24px',
          display: 'grid',
          gap: '24px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              Disponibilidad en Portal HSE
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              El rol <strong>ADMIN_GLOBAL</strong> posee directriz de bypass transversal en código duro.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {HSE_ROLES_ACTIVOS.map((rol) => {
            const meta = roles.find((r) => r.nombre === rol)
            const color = meta?.color ?? 'var(--text-secondary)'
            return (
              <span
                key={`hse-rol-activo-${rol}`}
                style={{
                  fontSize: '0.69rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  ...badgeColor(color),
                }}
              >
                {rol}
              </span>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {HSE_SUBMODULO_ROLES.map((row) => (
            <div
              key={`hse-submodulo-${row.submodulo}`}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '7px',
                }}
              >
                {row.submodulo}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {row.roles.map((rol) => {
                  const meta = roles.find((r) => r.nombre === rol)
                  const color = meta?.color ?? 'var(--text-secondary)'
                  return (
                    <span
                      key={`hse-submodulo-${row.submodulo}-${rol}`}
                      style={{
                        fontSize: '0.67rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        ...badgeColor(color),
                      }}
                    >
                      {rol}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
