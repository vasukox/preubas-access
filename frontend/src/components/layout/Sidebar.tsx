/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Sidebar — navegación principal del sistema.
 * Responsabilidades:
 * - Nav items filtrados por rol
 * - Estado activo por ruta
 * - Indicador sede activa + WS
 * - Avatar informativo del usuario
 * - Botón colapsar/expandir
 */

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Car, ShieldCheck, Cpu, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Building2, Wifi, WifiOff, Loader2,
  ChevronDown,
  LayoutGrid, ClipboardList, Eye, AlertTriangle, ClipboardCheck,
  Globe, BookOpen, ListChecks, Clock, FileBarChart2, Archive,
} from 'lucide-react'
import { useWSStore } from '@/store'
import type { RolNombre, UsuarioMe, SedeBasica } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────────
interface NavSubItem {
  id:    string
  label: string
  path:  string
  icon:  React.ReactNode
  roles: RolNombre[]
}

interface NavItem {
  id:       string
  label:    string
  path:     string
  icon:     React.ReactNode
  roles:    RolNombre[]
  badge?:   number
  children?: NavSubItem[]
}

interface SidebarProps {
  collapsed:      boolean
  onToggle:       () => void
  usuario:        UsuarioMe | null
  sedeActiva:     SedeBasica | null
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
    roles: ['ADMIN_GLOBAL','ADMIN_PARKING','ADMIN_HSE','GESTION_HSE','ADMIN_NFC','VIGILANTE_HSE','VIGILANTE_PARKING','VISUALIZADOR'],
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
    roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VIGILANTE_HSE','VISUALIZADOR'],
    children: [
      {
        id:    'hse-dashboard',
        label: 'Dashboard',
        path:  '/hse',
        icon:  <LayoutGrid size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VIGILANTE_HSE','VISUALIZADOR'],
      },
      {
        id:    'hse-panel',
        label: 'Panel General',
        path:  '/hse/panel-general',
        icon:  <Eye size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
      {
        id:    'hse-gestion',
        label: 'Gestión',
        path:  '/hse/gestion',
        icon:  <ClipboardList size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE'],
      },
      {
        id:    'hse-vigilante',
        label: 'Vigilante',
        path:  '/hse/vigilante',
        icon:  <ShieldCheck size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','VIGILANTE_HSE'],
      },
      {
        id:    'hse-excepciones',
        label: 'Excepciones',
        path:  '/hse/excepciones',
        icon:  <AlertTriangle size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE'],
      },
      {
        id:    'hse-cumplimiento',
        label: 'Cumplimiento',
        path:  '/hse/cumplimiento',
        icon:  <ClipboardCheck size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE'],
      },
      {
        id:    'hse-archivado',
        label: 'Cola de depuración',
        path:  '/hse/archivado',
        icon:  <Archive size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE'],
      },
    ],
  },
  {
    id:    'nfc',
    label: 'Activos NFC',
    path:  '/nfc',
    icon:  <Cpu size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_NFC','VISUALIZADOR'],
  },
  {
    id:    'reportes',
    label: 'Reportes',
    path:  '/reportes',
    icon:  <BarChart3 size={18} />,
    roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
    children: [
      {
        id:    'reportes-hse',
        label: 'Cumplimiento',
        path:  '/reportes/hse',
        icon:  <FileBarChart2 size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
      {
        id:    'reportes-autorizaciones',
        label: 'Autorizaciones',
        path:  '/reportes/autorizaciones',
        icon:  <ClipboardList size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
      {
        id:    'reportes-contratistas',
        label: 'Contratistas',
        path:  '/reportes/contratistas',
        icon:  <Users size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
      {
        id:    'reportes-accesos',
        label: 'Accesos',
        path:  '/reportes/accesos',
        icon:  <Eye size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
      {
        id:    'reportes-vencimientos',
        label: 'Vencimientos',
        path:  '/reportes/vencimientos',
        icon:  <AlertTriangle size={14} />,
        roles: ['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR'],
      },
    ],
  },
  {
    id:    'config',
    label: 'Configuración',
    path:  '/config',
    icon:  <Settings size={18} />,
    roles: ['ADMIN_GLOBAL'],
    children: [
      {
        id:    'config-sistema',
        label: 'Sistema',
        path:  '/config/sistema',
        icon:  <Globe size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-estructura',
        label: 'Estructura',
        path:  '/config/estructura',
        icon:  <Building2 size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-catalogos',
        label: 'Catálogos HSE',
        path:  '/config/catalogos',
        icon:  <ListChecks size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-normas',
        label: 'Normas HSE',
        path:  '/config/normas',
        icon:  <BookOpen size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-tiempos',
        label: 'Tiempos HSE',
        path:  '/config/tiempos',
        icon:  <Clock size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-proveedores',
        label: 'Proveedores HSE',
        path:  '/config/proveedores',
        icon:  <Building2 size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-usuarios',
        label: 'Usuarios del sistema',
        path:  '/config/usuarios',
        icon:  <Users size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
      {
        id:    'config-auditoria',
        label: 'Auditoría',
        path:  '/config/auditoria',
        icon:  <Clock size={14} />,
        roles: ['ADMIN_GLOBAL'],
      },
    ],
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

// ── NavGroup: item con sub-items colapsable ──────────────────────
function NavGroup({
  item,
  collapsed: sidebarCollapsed,
  userRoles,
}: {
  item:     NavItem
  collapsed: boolean
  userRoles: RolNombre[]
}) {
  const location  = useLocation()
  const isInGroup = location.pathname.startsWith(item.path)
  const [open, setOpen] = useState(isInGroup)

  const visibleChildren = (item.children ?? []).filter(c =>
    c.roles.some(r => userRoles.includes(r))
  )

  if (visibleChildren.length === 0) return null

  // El submenu es visible solo cuando el sidebar está expandido y open=true
  const submenuVisible = open && !sidebarCollapsed

  // Altura estimada por item para la transición de max-height
  const ITEM_HEIGHT_PX = 40
  const submenuMaxHeight = visibleChildren.length * ITEM_HEIGHT_PX + 8

  const isSubItemActive = (subPath: string, groupPath: string, currentPath: string): boolean => {
    // Root sub-route (e.g. /gh or /hse) should only match exactly.
    if (subPath === groupPath) {
      return currentPath === subPath || currentPath === `${subPath}/`
    }
    return currentPath === subPath || currentPath.startsWith(`${subPath}/`)
  }

  return (
    <div>
      {/* Cabecera del grupo */}
      <button
        onClick={() => setOpen(o => !o)}
        title={sidebarCollapsed ? item.label : undefined}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          padding:        sidebarCollapsed ? '10px 18px' : '10px 12px',
          width:          '100%',
          borderRadius:   'var(--radius-md)',
          border:         `1px solid ${isInGroup ? 'var(--primary-200)' : 'transparent'}`,
          background:     isInGroup ? 'linear-gradient(90deg, var(--primary-50) 0%, rgba(219,234,254,0.4) 100%)' : 'transparent',
          color:          isInGroup ? 'var(--primary-600)' : 'var(--text-secondary)',
          cursor:         'pointer',
          fontFamily:     'var(--font-ui)',
          textAlign:      'left',
          transition:     'all var(--transition-fast)',
          position:       'relative',
          whiteSpace:     'nowrap',
          overflow:       'hidden',
        }}
        onMouseEnter={e => {
          if (!isInGroup) e.currentTarget.style.background = 'var(--bg-raised)'
          if (!isInGroup) e.currentTarget.style.color      = 'var(--text-primary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isInGroup ? 'linear-gradient(90deg, var(--primary-50) 0%, rgba(219,234,254,0.4) 100%)' : 'transparent'
          e.currentTarget.style.color      = isInGroup ? 'var(--primary-600)' : 'var(--text-secondary)'
        }}
      >
        {/* Indicador activo */}
        {isInGroup && (
          <div style={{
            position:     'absolute',
            left:         0,
            top:          '50%',
            transform:    'translateY(-50%)',
            width:        '3px',
            height:       '65%',
            background:   'var(--gradient-primary)',
            borderRadius: '0 var(--radius-full) var(--radius-full) 0',
            boxShadow:    '2px 0 8px rgba(59, 130, 246, 0.35)',
          }} />
        )}
        <span style={{ flexShrink: 0 }}>{item.icon}</span>
        {!sidebarCollapsed && (
          <>
            <span style={{ fontSize: '0.85rem', fontWeight: isInGroup ? 600 : 400, flex: 1 }}>
              {item.label}
            </span>
            <ChevronDown
              size={13}
              style={{
                transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                opacity:    0.6,
              }}
            />
          </>
        )}
      </button>

      {/*
        Sub-items — siempre renderizados en el DOM para que la transición CSS
        funcione correctamente. Visibilidad controlada por max-height + opacity.
      */}
      <div
        style={{
          overflow:      'hidden',
          maxHeight:     submenuVisible ? `${submenuMaxHeight}px` : '0px',
          opacity:       submenuVisible ? 1 : 0,
          transition:    'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease',
          // Separador lateral animado junto con el contenido
          marginLeft:    '12px',
          marginTop:     submenuVisible ? '2px' : '0px',
        }}
      >
        <div
          style={{
            paddingLeft:   '14px',
            borderLeft:    '1px solid var(--border-subtle)',
            display:       'flex',
            flexDirection: 'column',
            gap:           '1px',
            paddingBottom: '2px',
          }}
        >
          {visibleChildren.map(sub => {
            const isActive = isSubItemActive(sub.path, item.path, location.pathname)
            return (
              <NavLink
                key={sub.id}
                to={sub.path}
                tabIndex={submenuVisible ? 0 : -1}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '8px',
                  padding:        '7px 10px',
                  borderRadius:   'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize:       '0.8rem',
                  fontWeight:     isActive ? 600 : 400,
                  color:          isActive ? 'var(--primary-600)' : 'var(--text-muted)',
                  background:     isActive ? 'var(--primary-50)' : 'transparent',
                  transition:     'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-raised)'
                    e.currentTarget.style.color      = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isActive ? 'var(--primary-50)' : 'transparent'
                  e.currentTarget.style.color      = isActive ? 'var(--primary-600)' : 'var(--text-muted)'
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{sub.icon}</span>
                {sub.label}
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle, usuario, sedeActiva, filteredNav }: SidebarProps) {
  const location       = useLocation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const userRoles = (usuario?.roles?.map(r => r.nombre) ?? []) as RolNombre[]

  return (
    <aside
      style={{
        width:         collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        minHeight:     '100vh',
        background:    'linear-gradient(180deg, #FFFFFF 0%, #F7FAFE 100%)',
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
        {/* Header — layout diferente según estado collapsed */}
        <div
          style={{
            height:         'var(--topbar-height)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding:        collapsed ? '0' : '0 10px 0 16px',
            borderBottom:   '1px solid var(--border-subtle)',
            gap:            '10px',
            flexShrink:     0,
          }}
        >
          {/* Ícono de marca — oculto cuando colapsado para dar espacio al botón */}
          {!collapsed && (
            <div
              style={{
                width:          '32px',
                height:         '32px',
                background:     'var(--gradient-brand)',
                borderRadius:   'var(--radius-md)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
                boxShadow:      '0 2px 8px rgba(37, 99, 235, 0.30)',
              }}
            >
              <ShieldCheck size={17} color="#FFFFFF" strokeWidth={2.5} />
            </div>
          )}

          {/* Textos — solo cuando expandido */}
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
                KOAJ ACCESS
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Permoda S.A.S.
              </div>
            </div>
          )}

          {/*
            Botón toggle — centrado solo en el header cuando colapsado,
            a la derecha del logo cuando expandido.
            Color amber diferenciado para que siempre se distinga.
          */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={onToggle}
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              style={{
                flexShrink:     0,
                width:          collapsed ? '40px' : '26px',
                height:         collapsed ? '40px' : '26px',
                borderRadius:   'var(--radius-md)',
                background:     collapsed ? 'var(--primary-50)' : 'transparent',
                border:         collapsed
                  ? '1px solid var(--primary-200)'
                  : '1px solid transparent',
                color:          collapsed ? 'var(--primary-600)' : 'var(--text-muted)',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'width var(--transition-base), height var(--transition-base), background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background  = 'var(--primary-100)'
                e.currentTarget.style.color       = 'var(--primary-700)'
                e.currentTarget.style.borderColor = 'var(--primary-300)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background  = collapsed ? 'var(--primary-50)' : 'transparent'
                e.currentTarget.style.color       = collapsed ? 'var(--primary-600)' : 'var(--text-muted)'
                e.currentTarget.style.borderColor = collapsed ? 'var(--primary-200)' : 'transparent'
              }}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={14} />}
            </button>
          </div>
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
            // Items con sub-menú
            if (item.children && item.children.length > 0) {
              return (
                <NavGroup
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  userRoles={userRoles}
                />
              )
            }

            // Items simples
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
                    ? 'linear-gradient(90deg, var(--primary-50) 0%, rgba(219,234,254,0.4) 100%)'
                    : isHovered ? 'var(--bg-raised)' : 'transparent',
                  border:         `1px solid ${isActive ? 'var(--primary-200)' : 'transparent'}`,
                  color:          isActive
                    ? 'var(--primary-600)'
                    : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  position:       'relative',
                  whiteSpace:     'nowrap',
                  overflow:       'hidden',
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position:     'absolute',
                      left:         0,
                      top:          '50%',
                      transform:    'translateY(-50%)',
                      width:        '3px',
                      height:       '65%',
                      background:   'var(--gradient-primary)',
                      borderRadius: '0 var(--radius-full) var(--radius-full) 0',
                      boxShadow:    '2px 0 8px rgba(59, 130, 246, 0.35)',
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
        {usuario && !collapsed && (
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <div
                style={{
                  width:          '34px',
                  height:         '34px',
                  borderRadius:   'var(--radius-full)',
                  background:     'var(--gradient-brand)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.85rem',
                  fontWeight:     700,
                  color:          '#FFFFFF',
                  flexShrink:     0,
                  boxShadow:      '0 2px 8px rgba(37, 99, 235, 0.25)',
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
            </div>
          </div>
        )}
    </aside>
  )
}

