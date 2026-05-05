/**
 * KOAJ Access v2.0 â€” Permoda S.A.S.
 * ------------------------------------
 * Router principal de la aplicaciÃ³n.
 *
 * Responsabilidades:
 * - Definir todas las rutas del sistema
 * - Proteger rutas segÃºn autenticaciÃ³n y rol
 * - Redirigir segÃºn estado de sesiÃ³n
 * - Lazy loading de vistas para mejor performance
 *
 * Tipos de ruta:
 *   PublicRoute  â†’ Solo accesible sin sesiÃ³n (login)
 *   PrivateRoute â†’ Requiere sesiÃ³n activa
 *   RoleRoute    â†’ Requiere sesiÃ³n + rol especÃ­fico
 *   PortalRoute  â†’ PÃºblico con token (autogestiÃ³n HSE, Parking, GH)
 *
 * â”€â”€ ConvenciÃ³n de comentarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Las vistas comentadas se descomentan sprint a sprint
 * conforme se implementan. NUNCA importar lo que no existe.
 *
 * âœ… Sprint 0 â€” Login
 * â³ Sprint 1 â€” Dashboard + Auth completo
 * â³ Sprint 2 â€” Personas
 * â³ Sprint 3 â€” Parking portal + manual
 * â³ Sprint 4 â€” Parking admin + LPR
 * â³ Sprint 5 â€” HSE wizard + lista
 * â³ Sprint 6 â€” HSE portales
 * â³ Sprint 7 â€” Activos NFC
 * â³ Sprint 8 â€” GestiÃ³n Humana
 * â³ Sprint 9 â€” Reportes + Config
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { RoleRoute } from './guards'

// â”€â”€ Vistas activas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// âœ… Sprint 0
const LoginView = lazy(() => import('@/views/auth/LoginView'))

// Layout principal
const AppLayout = lazy(() => import('@/components/layout/AppLayout'))

// âœ… Sprint 1
const DashboardView       = lazy(() => import('@/views/dashboard/DashboardView'))
const CambiarPasswordView = lazy(() => import('@/views/auth/CambiarPasswordView'))

// â³ Sprint 3-4 â€” Parking
// const ParkingDashboardView   = lazy(() => import('@/views/parking/ParkingDashboardView'))
// const ParkingSolicitudesView = lazy(() => import('@/views/parking/ParkingSolicitudesView'))
// const ParkingAdminView       = lazy(() => import('@/views/parking/ParkingAdminView'))
// const ParkingLPRView         = lazy(() => import('@/views/parking/ParkingLPRView'))
// const ParkingPortalView      = lazy(() => import('@/views/parking/ParkingPortalView'))

// â³ Sprint 5-6 â€” HSE
const HSEDashboardView       = lazy(() => import('@/views/hse/HSEDashboardView'))
const PanelGeneralView       = lazy(() => import('@/views/hse/PanelGeneralView'))
const GestionHSEView         = lazy(() => import('@/views/hse/GestionHSEView'))
const VigilanteView          = lazy(() => import('@/views/hse/VigilanteView'))
const ExcepcionesView        = lazy(() => import('@/views/hse/ExcepcionesView'))
const CumplimientoView       = lazy(() => import('@/views/hse/CumplimientoView'))
const AutogestionView        = lazy(() => import('@/views/hse/AutogestionView'))

// Herramientas â€” admin global
const HerramientasView = lazy(() => import('@/views/herramientas/HerramientasView'))
// const HSEAutorizacionesView  = lazy(() => import('@/views/hse/HSEAutorizacionesView'))
// const HSEAutorizacionDetalle = lazy(() => import('@/views/hse/HSEAutorizacionDetalle'))
// const HSEVigilanteView       = lazy(() => import('@/views/hse/HSEVigilanteView'))
// const HSEPlanillasView       = lazy(() => import('@/views/hse/HSEPlanillasView'))
// const HSEPortalView          = lazy(() => import('@/views/hse/HSEPortalView'))

// â³ Sprint 7 â€” NFC
// const NFCDashboardView = lazy(() => import('@/views/nfc/NFCDashboardView'))
// const NFCActivosView   = lazy(() => import('@/views/nfc/NFCActivosView'))
// const NFCEventosView   = lazy(() => import('@/views/nfc/NFCEventosView'))

// â³ Sprint 8 â€” GestiÃ³n Humana
const GHDashboardView    = lazy(() => import('@/views/gh/GHDashboardView'))
const GHCitasView        = lazy(() => import('@/views/gh/GHCitasView'))
const GHInduccionesView  = lazy(() => import('@/views/gh/GHInduccionesView'))
const GHDotacionView     = lazy(() => import('@/views/gh/GHDotacionView'))
const GHCitaDetalleView  = lazy(() => import('@/views/gh/GHCitaDetalleView'))
const GHImportacionView  = lazy(() => import('@/views/gh/GHImportacionView'))
const GHPortalView       = lazy(() => import('@/views/gh/GHPortalView'))
const GHPortalInduccionView = lazy(() => import('@/views/gh/GHPortalInduccionView'))

// â³ Sprint 9 â€” Reportes + Config
const ReportesView    = lazy(() => import('@/views/reportes/ReportesView'))
const ConfigLayout      = lazy(() => import('@/views/config/ConfigLayout'))
const ConfigSistema     = lazy(() => import('@/views/config/ConfigSistema'))
const ConfigEstructura  = lazy(() => import('@/views/config/ConfigEstructura'))
const ConfigCatalogos   = lazy(() => import('@/views/config/ConfigCatalogos'))
const ConfigNormas      = lazy(() => import('@/views/config/ConfigNormas'))
const ConfigActividades = lazy(() => import('@/views/config/ConfigActividades'))
const ConfigUsuariosGenerales = lazy(() => import('@/views/config/ConfigUsuariosGenerales'))


// â”€â”€ Fallback de carga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PageLoader() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '100vh',
        background:     'var(--bg-base)',
      }}
    >
      <div
        style={{
          width:        '28px',
          height:       '28px',
          border:       '2px solid var(--border-default)',
          borderTop:    '2px solid var(--primary-500)',
          borderRadius: '50%',
          animation:    'spin 1s linear infinite',
        }}
      />
    </div>
  )
}


// â”€â”€ Guardas de ruta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Ruta pÃºblica â€” solo accesible SIN sesiÃ³n activa.
 * Si hay sesiÃ³n redirige al dashboard.
 * Usado para: /login
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const usuario = useAuthStore((s) => s.usuario)
  
  if (isAuthenticated) {
    if (usuario?.debe_cambiar_password) {
      return <Navigate to="/cambiar-password" replace />
    }
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

/**
 * Ruta privada â€” requiere sesiÃ³n activa.
 * Si no hay sesiÃ³n redirige a /login guardando la ruta actual.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const usuario         = useAuthStore((s) => s.usuario)
  const location        = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar si se le exige cambiar contraseÃ±a y no estÃ¡ en esa vista
  if (usuario?.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />
  }

  return <>{children}</>
}



// â”€â”€ Router principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* â”€â”€ Rutas pÃºblicas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginView />
            </PublicRoute>
          }
        />

        {/* â”€â”€ Portales pÃºblicos â€” Sprint 3, 5 y 8 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* <Route path="/portal/parking" element={<PortalRoute><ParkingPortalView /></PortalRoute>} /> */}
        <Route path="/portal/hse/:token" element={<AutogestionView />} />
        <Route path="/portal/gh/:token" element={<GHPortalView />} />
        <Route path="/portal/gh/induccion/:token" element={<GHPortalInduccionView />} />

        {/* â”€â”€ Rutas privadas separadas (sin layout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Route
          path="/cambiar-password"
          element={
            <PrivateRoute>
              <CambiarPasswordView />
            </PrivateRoute>
          }
        />

        {/* â”€â”€ Rutas privadas (dentro del AppLayout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Redirect raÃ­z â†’ dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* âœ… Sprint 1 */}
          <Route path="dashboard" element={<DashboardView />} />

          {/* â³ Sprint 3-4 â€” Parking */}
          {/* <Route path="parking" element={<RoleRoute roles={['ADMIN_PARKING','VIGILANTE','VISUALIZADOR']}><ParkingDashboardView /></RoleRoute>} /> */}
          {/* <Route path="parking/solicitudes" element={<RoleRoute roles={['ADMIN_PARKING','VIGILANTE']}><ParkingSolicitudesView /></RoleRoute>} /> */}
          {/* <Route path="parking/admin" element={<RoleRoute roles={['ADMIN_PARKING']}><ParkingAdminView /></RoleRoute>} /> */}
          {/* <Route path="parking/lpr"   element={<RoleRoute roles={['ADMIN_PARKING']}><ParkingLPRView /></RoleRoute>} /> */}

          {/* â³ Sprint 5-6 â€” HSE */}
          <Route path="hse"               element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VIGILANTE_HSE','VISUALIZADOR']}><HSEDashboardView /></RoleRoute>} />
          <Route path="hse/panel-general" element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE','VISUALIZADOR']}><PanelGeneralView /></RoleRoute>} />
          <Route path="hse/gestion"       element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE']}><GestionHSEView /></RoleRoute>} />
          <Route path="hse/vigilante"     element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','VIGILANTE_HSE']}><VigilanteView /></RoleRoute>} />
          <Route path="hse/excepciones"   element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE']}><ExcepcionesView /></RoleRoute>} />
          <Route path="hse/cumplimiento"  element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','GESTION_HSE']}><CumplimientoView /></RoleRoute>} />

          {/* Herramientas â€” solo ADMIN_GLOBAL */}
          <Route path="herramientas" element={<RoleRoute roles={['ADMIN_GLOBAL']}><HerramientasView /></RoleRoute>} />
          {/* <Route path="hse" element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE','VIGILANTE','VISUALIZADOR']}><HSEDashboardView /></RoleRoute>} /> */}
          {/* <Route path="hse/autorizaciones"    element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEAutorizacionesView /></RoleRoute>} /> */}
          {/* <Route path="hse/autorizaciones/:id" element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEAutorizacionDetalle /></RoleRoute>} /> */}
          {/* <Route path="hse/vigilante"  element={<RoleRoute roles={['VIGILANTE','COORD_HSE','ADMIN_HSE']}><HSEVigilanteView /></RoleRoute>} /> */}
          {/* <Route path="hse/planillas"  element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEPlanillasView /></RoleRoute>} /> */}

          {/* â³ Sprint 7 â€” NFC */}
          {/* <Route path="nfc"         element={<RoleRoute roles={['ADMIN_NFC','VISUALIZADOR']}><NFCDashboardView /></RoleRoute>} /> */}
          {/* <Route path="nfc/activos" element={<RoleRoute roles={['ADMIN_NFC']}><NFCActivosView /></RoleRoute>} /> */}
          {/* <Route path="nfc/eventos" element={<RoleRoute roles={['ADMIN_NFC']}><NFCEventosView /></RoleRoute>} /> */}

          {/* â³ Sprint 8 â€” GestiÃ³n Humana */}
          <Route path="gh"              element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH','VISUALIZADOR']}><GHDashboardView /></RoleRoute>} />
          <Route path="gh/citas"        element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH']}><GHCitasView /></RoleRoute>} />
          <Route path="gh/inducciones"  element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH']}><GHInduccionesView /></RoleRoute>} />
          <Route path="gh/dotacion"     element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH']}><GHDotacionView /></RoleRoute>} />
          <Route path="gh/citas/:id"    element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH','VISUALIZADOR']}><GHCitaDetalleView /></RoleRoute>} />
          <Route path="gh/importacion"  element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_GH']}><GHImportacionView /></RoleRoute>} />

          {/* â³ Sprint 9 â€” Reportes + Config */}
          <Route path="reportes" element={<RoleRoute roles={['ADMIN_GLOBAL','ADMIN_HSE','VISUALIZADOR']}><ReportesView /></RoleRoute>} />

          {/* Config â€” sub-rutas por Ã¡rea */}
          <Route path="config" element={<RoleRoute roles={['ADMIN_GLOBAL']}><ConfigLayout /></RoleRoute>}>
            <Route index element={<Navigate to="sistema" replace />} />
            <Route path="sistema"    element={<ConfigSistema />} />
            <Route path="estructura" element={<ConfigEstructura />} />
            <Route path="catalogos"  element={<ConfigCatalogos />} />
            <Route path="normas"     element={<ConfigNormas />} />
            <Route path="actividades" element={<ConfigActividades />} />
            <Route path="usuarios-generales" element={<ConfigUsuariosGenerales />} />
          </Route>

        </Route>

        {/* â”€â”€ 404 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Route
          path="*"
          element={
            <div style={{ color: 'var(--text-primary)', padding: '2rem', fontFamily: 'var(--font-ui)' }}>
              404 â€” PÃ¡gina no encontrada
            </div>
          }
        />

      </Routes>
    </Suspense>
  )
}



