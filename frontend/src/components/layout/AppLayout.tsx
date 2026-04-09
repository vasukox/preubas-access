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
import { hseService } from '@/services/hse.service'

export default function AppLayout() {
  const { usuario, hasAnyRole, clearSession }          = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, themeMode, toggleTheme } = useUIStore()
  const { noLeidas }                                   = useAlertsStore()
  const { sedeActiva, sedes, setSedes, setSedeActiva } = useSedeStore()
  const location                                       = useLocation()

  // Cargar sedes disponibles al montar el layout
  useEffect(() => {
    hseService.getSedes().then(data => {
      setSedes(data)

      // Si es vigilante con sede asignada, forzar esa sede y no dejar cambiarla
      const sedeAsignadaId = usuario?.sede_asignada_id
      if (sedeAsignadaId) {
        const sedeDelVigilante = data.find(s => s.id === sedeAsignadaId)
        if (sedeDelVigilante) {
          setSedeActiva(sedeDelVigilante)
          return  // salir sin permitir otro setSedeActiva
        }
      }

      // Para no-vigilantes: normalizar sede activa persistida
      const sedePersistidaValida = !!sedeActiva && data.some(s => s.id === sedeActiva.id)
      if (!sedePersistidaValida) {
        if (data.length > 0) setSedeActiva(data[0])
      }
    }).catch((e) => { console.error('[AppLayout] Error al cargar sedes:', e) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    document.documentElement.style.colorScheme = themeMode
  }, [themeMode])

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
        filteredNav={filteredNav}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          usuario={usuario}
          noLeidas={noLeidas}
          paginaActual={paginaActual}
          onMenuClick={toggleSidebar}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          sedes={sedes}
          sedeActiva={sedeActiva}
          onSedeChange={setSedeActiva}
          onLogout={clearSession}
          sedeIsLocked={!!usuario?.sede_asignada_id}
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
