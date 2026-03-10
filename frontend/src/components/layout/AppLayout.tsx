/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * AppLayout — composición pura del layout autenticado.
 *
 * Estructura:
 *   ┌─────────────────────────────────────────┐
 *   │  Sidebar (240px / 64px colapsado)       │
 *   │  ┌───────────────────────────────────┐  │
 *   │  │  Topbar (60px)                    │  │
 *   │  ├───────────────────────────────────┤  │
 *   │  │  <Outlet /> — contenido de vista  │  │
 *   │  └───────────────────────────────────┘  │
 *   └─────────────────────────────────────────┘
 *
 * Este archivo solo orquesta — toda la lógica visual
 * vive en Sidebar.tsx y Topbar.tsx.
 *
 * Fix aplicado (code review):
 * - useEffect WS con connect/disconnect como dependencias estables
 * - hover de nav items via estado React (no mutación directa del DOM)
 * - replace(/_/g, ' ') consistente en ambos usos
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, useUIStore, useWSStore, useAlertsStore, useSedeStore } from '@/store'
import { Sidebar, NAV_ITEMS } from './Sidebar'
import { Topbar } from './Topbar'

export default function AppLayout() {
  const { usuario, hasAnyRole, clearSession } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar }   = useUIStore()
  const { noLeidas }                          = useAlertsStore()
  const { sedeActiva }                        = useSedeStore()
  const location                              = useLocation()

  // Fix code review: connect y disconnect como referencias estables del store
  const connect    = useWSStore((s) => s.connect)
  const disconnect = useWSStore((s) => s.disconnect)

  // Conectar WS cuando hay sede activa
  // Fix code review: dependencias completas en el array
  useEffect(() => {
    if (sedeActiva?.id) {
      connect(sedeActiva.id)
    }
    return () => disconnect()
  }, [sedeActiva?.id, connect, disconnect])

  // Filtrar nav items según los roles del usuario
  const filteredNav = NAV_ITEMS.filter((item) => hasAnyRole(item.roles))

  // Título de la página actual para el Topbar
  const paginaActual = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path)
  )?.label

  return (
    <div
      style={{
        display:    'flex',
        minHeight:  '100vh',
        background: 'var(--bg-base)',
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        usuario={usuario}
        sedeActiva={sedeActiva}
        onLogout={clearSession}
        filteredNav={filteredNav}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          usuario={usuario}
          noLeidas={noLeidas}
          paginaActual={paginaActual}
          onMenuClick={toggleSidebar}
        />

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
