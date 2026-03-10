/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Layout principal de la aplicación autenticada.
 *
 * Estructura:
 *   ┌─────────────────────────────────────────┐
 *   │  Sidebar (240px / 64px colapsado)        │
 *   │  ┌───────────────────────────────────┐   │
 *   │  │  Topbar (60px)                    │   │
 *   │  ├───────────────────────────────────┤   │
 *   │  │  <Outlet /> — contenido de vista  │   │
 *   │  └───────────────────────────────────┘   │
 *   └─────────────────────────────────────────┘
 *
 * Responsabilidades:
 * - Renderizar Sidebar + Topbar + contenido
 * - Manejar estado colapsado del sidebar
 * - Conectar WebSocket al montar
 * - Mostrar Modal y Drawer globales
 */

import { useEffect } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  ShieldCheck,
  Cpu,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  Building2,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'

import { useAuthStore, useUIStore, useWSStore, useAlertsStore, useSedeStore } from '@/store'
import type { RolNombre } from '@/types'

// ── Definición del menú de navegación ────────────────────────────
interface NavItem {
  id:     string
  label:  string
  path:   string
  icon:   React.ReactNode
  roles:  RolNombre[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  {
    id:    'dashboard',
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  <LayoutDashboard size={18} />,
    roles: ['ADMIN_GLOBAL', 'ADMIN_PARKING', 'ADMIN_HSE', 'COORD_HSE', 'ADMIN_NFC', 'ADMIN_GH', 'VIGILANTE', 'VISUALIZADOR'],
  },
  {
    id:    'parking',
    label: 'Parking',
    path:  '/parking',
    icon:  <Car size={18} />,
    roles: ['ADMIN_GLOBAL', 'ADMIN_PARKING', 'VIGILANTE', 'VISUALIZADOR'],
  },
  {
    id:    'hse',
    label: 'HSE',
    path:  '/hse',
    icon:  <ShieldCheck size={18} />,
    roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'COORD_HSE', 'VIGILANTE', 'VISUALIZADOR'],
  },
  {
    id:    'nfc',
    label: 'Activos NFC',
    path:  '/nfc',
    icon:  <Cpu size={18} />,
    roles: ['ADMIN_GLOBAL', 'ADMIN_NFC', 'VISUALIZADOR'],
  },
  {
    id:    'gh',
    label: 'Gestión Humana',
    path:  '/gh',
    icon:  <Users size={18} />,
    roles: ['ADMIN_GLOBAL', 'ADMIN_GH', 'VISUALIZADOR'],
  },
  {
    id:    'reportes',
    label: 'Reportes',
    path:  '/reportes',
    icon:  <BarChart3 size={18} />,
    roles: ['ADMIN_GLOBAL', 'VISUALIZADOR'],
  },
  {
    id:    'config',
    label: 'Configuración',
    path:  '/config',
    icon:  <Settings size={18} />,
    roles: ['ADMIN_GLOBAL'],
  },
]

// ── Indicador de conexión WS ──────────────────────────────────────
function WSIndicator() {
  const status = useWSStore((s) => s.status)

  const config = {
    CONECTADO:     { icon: <Wifi size={13} />,      color: 'var(--success-500)', label: 'En línea' },
    DESCONECTADO:  { icon: <WifiOff size={13} />,   color: 'var(--text-muted)',  label: 'Desconectado' },
    RECONECTANDO:  { icon: <Loader2 size={13} className="animate-spin" />, color: 'var(--warning-500)', label: 'Reconectando' },
    ERROR:         { icon: <WifiOff size={13} />,   color: 'var(--danger-500)', label: 'Error' },
  }[status]

  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
        color:      config.color,
        fontSize:   '0.7rem',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        transition: 'color var(--transition-fast)',
      }}
      title={config.label}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function AppLayout() {
  const { usuario, hasAnyRole, clearSession }  = useAuthStore()
  const { sidebarCollapsed, toggleSidebar }    = useUIStore()
  const { connect, disconnect }                = useWSStore()
  const { noLeidas }                           = useAlertsStore()
  const { sedeActiva }                         = useSedeStore()
  const location                               = useLocation()

  // Conectar WS cuando hay sede activa
  useEffect(() => {
    if (sedeActiva?.id) {
      connect(sedeActiva.id)
    }
    return () => disconnect()
  }, [sedeActiva?.id])

  // Filtrar nav items por rol del usuario
  const navItems = NAV_ITEMS.filter((item) =>
    hasAnyRole(item.roles)
  )

  // Título de la página actual
  const currentNav = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path)
  )

  return (
    <div
      style={{
        display:   'flex',
        minHeight: '100vh',
        background: 'var(--bg-base)',
      }}
    >
      {/* ══ SIDEBAR ═══════════════════════════════════════════════ */}
      <aside
        style={{
          width:      sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          minHeight:  '100vh',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display:    'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-base)',
          overflow:   'hidden',
          position:   'sticky',
          top:        0,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height:     'var(--topbar-height)',
            display:    'flex',
            alignItems: 'center',
            padding:    sidebarCollapsed ? '0 20px' : '0 24px',
            borderBottom: '1px solid var(--border-subtle)',
            gap:        '10px',
            flexShrink: 0,
          }}
        >
          {/* Ícono del logo */}
          <div
            style={{
              width:        '28px',
              height:       '28px',
              background:   'var(--primary-500)',
              borderRadius: 'var(--radius-sm)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              flexShrink:   0,
              boxShadow:    'var(--shadow-glow-primary)',
            }}
          >
            <ShieldCheck size={16} color="var(--text-inverted)" strokeWidth={2.5} />
          </div>

          {/* Nombre — solo visible expandido */}
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '0.85rem',
                  fontWeight:    700,
                  color:         'var(--text-primary)',
                  letterSpacing: '0.1em',
                  whiteSpace:    'nowrap',
                }}
              >
                KOAJ ACCESS
              </div>
              <div
                style={{
                  fontFamily:    'var(--font-ui)',
                  fontSize:      '0.65rem',
                  color:         'var(--text-muted)',
                  letterSpacing: '0.05em',
                  whiteSpace:    'nowrap',
                }}
              >
                Permoda S.A.S.
              </div>
            </div>
          )}
        </div>

        {/* Sede activa */}
        {!sidebarCollapsed && sedeActiva && (
          <div
            style={{
              margin:        '12px 12px 4px',
              padding:       '8px 12px',
              background:    'var(--bg-raised)',
              borderRadius:  'var(--radius-md)',
              border:        '1px solid var(--border-subtle)',
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
            flex:    1,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap:     '2px',
            overflowY: 'auto',
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '10px',
                  padding:       sidebarCollapsed ? '10px 18px' : '10px 12px',
                  borderRadius:  'var(--radius-md)',
                  textDecoration: 'none',
                  transition:    'all var(--transition-fast)',
                  background:    isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                  border:        `1px solid ${isActive ? 'rgba(245,158,11,0.2)' : 'transparent'}`,
                  color:         isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                  position:      'relative',
                  whiteSpace:    'nowrap',
                  overflow:      'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-raised)'
                    e.currentTarget.style.color      = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color      = 'var(--text-secondary)'
                  }
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

                {!sidebarCollapsed && (
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

        {/* Footer del sidebar — usuario */}
        {usuario && (
          <div
            style={{
              padding:     '12px 8px',
              borderTop:   '1px solid var(--border-subtle)',
              flexShrink:  0,
            }}
          >
            {!sidebarCollapsed ? (
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '8px',
                  borderRadius: 'var(--radius-md)',
                  cursor:       'pointer',
                }}
              >
                {/* Avatar */}
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
                  <div
                    style={{
                      fontSize:     '0.8rem',
                      fontWeight:   600,
                      color:        'var(--text-primary)',
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {usuario.nombre_completo}
                  </div>
                  <div
                    style={{
                      fontSize:     '0.65rem',
                      color:        'var(--text-muted)',
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {usuario.roles[0]?.rol.nombre.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={clearSession}
                  title="Cerrar sesión"
                  style={{
                    background:   'transparent',
                    border:       'none',
                    color:        'var(--text-muted)',
                    cursor:       'pointer',
                    padding:      '4px',
                    borderRadius: 'var(--radius-sm)',
                    display:      'flex',
                    transition:   'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-400)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={clearSession}
                title="Cerrar sesión"
                style={{
                  width:          '100%',
                  background:     'transparent',
                  border:         'none',
                  color:          'var(--text-muted)',
                  cursor:         'pointer',
                  padding:        '10px',
                  borderRadius:   'var(--radius-md)',
                  display:        'flex',
                  justifyContent: 'center',
                  transition:     'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-400)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}

        {/* Botón colapsar */}
        <button
          onClick={toggleSidebar}
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
          {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ══ ÁREA PRINCIPAL ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── TOPBAR ─────────────────────────────────────────── */}
        <header
          style={{
            height:      'var(--topbar-height)',
            background:  'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display:     'flex',
            alignItems:  'center',
            padding:     '0 24px',
            gap:         '16px',
            position:    'sticky',
            top:         0,
            zIndex:      50,
            flexShrink:  0,
          }}
        >
          {/* Botón menú mobile */}
          <button
            onClick={toggleSidebar}
            style={{
              background:   'transparent',
              border:       'none',
              color:        'var(--text-muted)',
              cursor:       'pointer',
              display:      'none', // Se muestra en mobile via media query
              padding:      '4px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Menu size={20} />
          </button>

          {/* Título de la página actual */}
          <div style={{ flex: 1 }}>
            {currentNav && (
              <h1
                style={{
                  fontSize:      '0.95rem',
                  fontWeight:    600,
                  color:         'var(--text-primary)',
                  letterSpacing: '0.01em',
                }}
              >
                {currentNav.label}
              </h1>
            )}
          </div>

          {/* Acciones del topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Botón alertas */}
            <button
              style={{
                position:       'relative',
                background:     'transparent',
                border:         '1px solid var(--border-default)',
                borderRadius:   'var(--radius-md)',
                color:          'var(--text-secondary)',
                cursor:         'pointer',
                padding:        '7px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.color       = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color       = 'var(--text-secondary)'
              }}
            >
              <Bell size={16} />
              {noLeidas > 0 && (
                <span
                  style={{
                    position:     'absolute',
                    top:          '-5px',
                    right:        '-5px',
                    background:   'var(--danger-500)',
                    color:        '#fff',
                    fontSize:     '0.6rem',
                    fontWeight:   700,
                    width:        '16px',
                    height:       '16px',
                    borderRadius: 'var(--radius-full)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                  }}
                >
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                width:      '1px',
                height:     '24px',
                background: 'var(--border-default)',
              }}
            />

            {/* Avatar usuario */}
            {usuario && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    cursor:         'pointer',
                    boxShadow:      'var(--shadow-glow-primary)',
                  }}
                >
                  {usuario.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {usuario.nombre_completo.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {usuario.roles[0]?.rol.nombre.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── CONTENIDO ──────────────────────────────────────── */}
        <main
          style={{
            flex:     1,
            padding:  '24px',
            overflow: 'auto',
          }}
          className="animate-fade-up"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}