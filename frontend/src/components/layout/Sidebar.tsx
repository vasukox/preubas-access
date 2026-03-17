/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Sidebar — navegación principal del sistema.
 * Responsabilidades:
 * - Nav items filtrados por rol
 * - Estado activo por ruta
 * - Indicador sede activa + WS
 * - Avatar + logout del usuario
 * - Botón colapsar/expandir
 */

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Car, ShieldCheck, Cpu, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  LogOut, Building2, Wifi, WifiOff, Loader2,
} from 'lucide-react'
import { useWSStore } from '@/store'
import type { RolNombre, UsuarioMe } from '@/types'
import type { Sede } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────────
interface NavItem {
  id:     string
  label:  string
  path:   string
  icon:   React.ReactNode
  roles:  RolNombre[]
  badge?: number
}

interface SidebarProps {
  collapsed:      boolean
  onToggle:       () => void
  usuario:        UsuarioMe | null
  sedeActiva:     Sede | null
  onLogout:       () => void
  filteredNav:    NavItem[]
}

// ── Catálogo de navegación ────────────────────────────────────────
// Exportado para que AppLayout pueda filtrarlo por rol
export const NAV_ITEMS: NavItem[] = [
  {
    id:    'dashboard',
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  <LayoutDashboard size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_PARKING','ADMIN_HSE','ADMIN_NFC','ADMIN_GH','VIGILANTE_HSE','VIGILANTE_PARKING','VISUALIZADOR'],
  },
  {
    id:    'parking',
    label: 'Parking',
    path:  '/parking',
    icon:  <Car size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_PARKING','VIGILANTE_PARKING','VISUALIZADOR'],
  },
  {
    id:    'hse',
    label: 'HSE',
    path:  '/hse',
    icon:  <ShieldCheck size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_HSE','VIGILANTE_HSE','VISUALIZADOR'],
  },
  {
    id:    'nfc',
    label: 'Activos NFC',
    path:  '/nfc',
    icon:  <Cpu size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_NFC','VISUALIZADOR'],
  },
  {
    id:    'gh',
    label: 'Gestión Humana',
    path:  '/gh',
    icon:  <Users size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_GH','VISUALIZADOR'],
  },
  {
    id:    'reportes',
    label: 'Reportes',
    path:  '/reportes',
    icon:  <BarChart3 size={18} />,
    roles: ['ADMIN_GLOBAL','VISUALIZADOR'],
  },
  {
    id:    'config',
    label: 'Configuración',
    path:  '/config',
    icon:  <Settings size={18} />,
    roles: ['ADMIN_GLOBAL'],
  },
]

// ── Indicador WS ──────────────────────────────────────────────────
function WSIndicator() {
  const status = useWSStore((s) => s.status)

  const config = {
    CONECTADO:    { icon: <Wifi size={13} />,    color: 'var(--success-500)',  label: 'En línea' },
    DESCONECTADO: { icon: <WifiOff size={13} />, color: 'var(--text-muted)',   label: 'Desconectado' },
    RECONECTANDO: { icon: <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />, color: 'var(--warning-500)', label: 'Reconectando' },
    ERROR:        { icon: <WifiOff size={13} />, color: 'var(--danger-500)',   label: 'Error' },
  }[status]

  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
        color:         config.color,
        fontSize:      '0.7rem',
        fontFamily:    'var(--font-mono)',
        letterSpacing: '0.05em',
        transition:    'color var(--transition-fast)',
        marginTop:     '4px',
      }}
      title={config.label}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle, usuario, sedeActiva, onLogout, filteredNav }: SidebarProps) {
  const location       = useLocation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <aside
      style={{
        width:         collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        minHeight:     '100vh',
        background:    'var(--bg-surface)',
        borderRight:   '1px solid var(--border-subtle)',
        display:       'flex',
        flexDirection: 'column',
        transition:    'width var(--transition-base)',
        overflow:      'hidden',
        position:      'sticky',
        top:           0,
        flexShrink:    0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height:        'var(--topbar-height)',
          display:       'flex',
          alignItems:    'center',
          padding:       collapsed ? '0 20px' : '0 24px',
          borderBottom:  '1px solid var(--border-subtle)',
          gap:           '10px',
          flexShrink:    0,
        }}
      >
        <div
          style={{
            width:          '28px',
            height:         '28px',
            background:     'var(--primary-500)',
            borderRadius:   'var(--radius-sm)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      'var(--shadow-glow-primary)',
          }}
        >
          <ShieldCheck size={16} color="var(--text-inverted)" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              KOAJ ACCESS
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Permoda S.A.S.
            </div>
          </div>
        )}
      </div>

      {/* Sede activa */}
      {!collapsed && sedeActiva && (
        <div
          style={{
            margin:       '12px 12px 4px',
            padding:      '8px 12px',
            background:   'var(--bg-raised)',
            borderRadius: 'var(--radius-md)',
            border:       '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>
            SEDE ACTIVA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={12} color="var(--primary-400)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {sedeActiva.nombre}
            </span>
          </div>
          <WSIndicator />
        </div>
      )}

      {/* Nav items */}
      <nav
        style={{
          flex:          1,
          padding:       '8px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '2px',
          overflowY:     'auto',
        }}
      >
        {filteredNav.map((item) => {
          const isActive  = location.pathname.startsWith(item.path)
          const isHovered = hoveredId === item.id

          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        collapsed ? '10px 18px' : '10px 12px',
                borderRadius:   'var(--radius-md)',
                textDecoration: 'none',
                transition:     'all var(--transition-fast)',
                background:     isActive
                  ? 'rgba(245,158,11,0.1)'
                  : isHovered ? 'var(--bg-raised)' : 'transparent',
                border:         `1px solid ${isActive ? 'rgba(245,158,11,0.2)' : 'transparent'}`,
                color:          isActive
                  ? 'var(--primary-400)'
                  : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                position:       'relative',
                whiteSpace:     'nowrap',
                overflow:       'hidden',
              }}
            >
              {/* Indicador activo */}
              {isActive && (
                <div
                  style={{
                    position:     'absolute',
                    left:         0,
                    top:          '50%',
                    transform:    'translateY(-50%)',
                    width:        '3px',
                    height:       '60%',
                    background:   'var(--primary-500)',
                    borderRadius: '0 var(--radius-full) var(--radius-full) 0',
                    boxShadow:    'var(--shadow-glow-primary)',
                  }}
                />
              )}
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, flex: 1 }}>
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        background:   'var(--primary-500)',
                        color:        'var(--text-inverted)',
                        fontSize:     '0.65rem',
                        fontWeight:   700,
                        padding:      '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        minWidth:     '18px',
                        textAlign:    'center',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer — usuario */}
      {usuario && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <div
                style={{
                  width:          '32px',
                  height:         '32px',
                  borderRadius:   'var(--radius-full)',
                  background:     'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.75rem',
                  fontWeight:     700,
                  color:          'var(--text-inverted)',
                  flexShrink:     0,
                }}
              >
                {usuario.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {usuario.nombre_completo}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {usuario.roles?.[0]?.nombre?.replace(/_/g, ' ') || 'Sin Rol'}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger-400)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger-400)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}

      {/* Botón colapsar */}
      <button
        onClick={onToggle}
        style={{
          position:       'absolute',
          top:            '18px',
          right:          '-12px',
          width:          '24px',
          height:         '24px',
          borderRadius:   'var(--radius-full)',
          background:     'var(--bg-raised)',
          border:         '1px solid var(--border-default)',
          color:          'var(--text-muted)',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      'var(--shadow-sm)',
          transition:     'all var(--transition-fast)',
          zIndex:         10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-overlay)'
          e.currentTarget.style.color      = 'var(--primary-400)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-raised)'
          e.currentTarget.style.color      = 'var(--text-muted)'
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}