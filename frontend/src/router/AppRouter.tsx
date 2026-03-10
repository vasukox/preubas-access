/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Router principal de la aplicación.
 *
 * Responsabilidades:
 * - Definir todas las rutas del sistema
 * - Proteger rutas según autenticación y rol
 * - Redirigir según estado de sesión
 * - Lazy loading de vistas para mejor performance
 *
 * Tipos de ruta:
 *   PublicRoute  → Solo accesible sin sesión (login)
 *   PrivateRoute → Requiere sesión activa
 *   RoleRoute    → Requiere sesión + rol específico
 *   PortalRoute  → Público con token (autogestión HSE, Parking, GH)
 *
 * ── Convención de comentarios ────────────────────────────────────
 * Las vistas comentadas se descomentan sprint a sprint
 * conforme se implementan. NUNCA importar lo que no existe.
 *
 * ✅ Sprint 0 — Login
 * ⏳ Sprint 1 — Dashboard + Auth completo
 * ⏳ Sprint 2 — Personas
 * ⏳ Sprint 3 — Parking portal + manual
 * ⏳ Sprint 4 — Parking admin + LPR
 * ⏳ Sprint 5 — HSE wizard + lista
 * ⏳ Sprint 6 — HSE portales
 * ⏳ Sprint 7 — Activos NFC
 * ⏳ Sprint 8 — Gestión Humana
 * ⏳ Sprint 9 — Reportes + Config
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
// import { RoleRoute, PortalRoute } from './guards'  // ← descomentar en Sprint 2

// ── Vistas activas ────────────────────────────────────────────────

// ✅ Sprint 0
const LoginView = lazy(() => import('@/views/auth/LoginView'))

// Layout principal
const AppLayout = lazy(() => import('@/components/layout/AppLayout'))

// ⏳ Sprint 1 — descomentar cuando existan
// const DashboardView       = lazy(() => import('@/views/dashboard/DashboardView'))
// const CambiarPasswordView = lazy(() => import('@/views/auth/CambiarPasswordView'))

// ⏳ Sprint 3-4 — Parking
// const ParkingDashboardView   = lazy(() => import('@/views/parking/ParkingDashboardView'))
// const ParkingSolicitudesView = lazy(() => import('@/views/parking/ParkingSolicitudesView'))
// const ParkingAdminView       = lazy(() => import('@/views/parking/ParkingAdminView'))
// const ParkingLPRView         = lazy(() => import('@/views/parking/ParkingLPRView'))
// const ParkingPortalView      = lazy(() => import('@/views/parking/ParkingPortalView'))

// ⏳ Sprint 5-6 — HSE
// const HSEDashboardView       = lazy(() => import('@/views/hse/HSEDashboardView'))
// const HSEAutorizacionesView  = lazy(() => import('@/views/hse/HSEAutorizacionesView'))
// const HSEAutorizacionDetalle = lazy(() => import('@/views/hse/HSEAutorizacionDetalle'))
// const HSEVigilanteView       = lazy(() => import('@/views/hse/HSEVigilanteView'))
// const HSEPlanillasView       = lazy(() => import('@/views/hse/HSEPlanillasView'))
// const HSEPortalView          = lazy(() => import('@/views/hse/HSEPortalView'))

// ⏳ Sprint 7 — NFC
// const NFCDashboardView = lazy(() => import('@/views/nfc/NFCDashboardView'))
// const NFCActivosView   = lazy(() => import('@/views/nfc/NFCActivosView'))
// const NFCEventosView   = lazy(() => import('@/views/nfc/NFCEventosView'))

// ⏳ Sprint 8 — Gestión Humana
// const GHDashboardView    = lazy(() => import('@/views/gh/GHDashboardView'))
// const GHCitasView        = lazy(() => import('@/views/gh/GHCitasView'))
// const GHImportacionView  = lazy(() => import('@/views/gh/GHImportacionView'))
// const GHPortalView       = lazy(() => import('@/views/gh/GHPortalView'))

// ⏳ Sprint 9 — Reportes + Config
// const ReportesView = lazy(() => import('@/views/reportes/ReportesView'))
// const ConfigView   = lazy(() => import('@/views/config/ConfigView'))


// ── Fallback de carga ─────────────────────────────────────────────
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


// ── Guardas de ruta ───────────────────────────────────────────────

/**
 * Ruta pública — solo accesible SIN sesión activa.
 * Si hay sesión redirige al dashboard.
 * Usado para: /login
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

/**
 * Ruta privada — requiere sesión activa.
 * Si no hay sesión redirige a /login guardando la ruta actual.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location        = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}



// ── Router principal ──────────────────────────────────────────────
export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Rutas públicas ──────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginView />
            </PublicRoute>
          }
        />

        {/* ── Portales públicos — Sprint 3, 5 y 8 ─────────────── */}
        {/* <Route path="/portal/parking" element={<PortalRoute><ParkingPortalView /></PortalRoute>} /> */}
        {/* <Route path="/portal/hse"     element={<PortalRoute><HSEPortalView /></PortalRoute>} />     */}
        {/* <Route path="/portal/gh"      element={<PortalRoute><GHPortalView /></PortalRoute>} />      */}

        {/* ── Rutas privadas (dentro del AppLayout) ────────────── */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          {/* Redirect raíz → dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* ⏳ Sprint 1 */}
          {/* <Route path="dashboard"        element={<DashboardView />} /> */}
          {/* <Route path="cambiar-password" element={<CambiarPasswordView />} /> */}

          {/* ⏳ Sprint 3-4 — Parking */}
          {/* <Route path="parking" element={<RoleRoute roles={['ADMIN_PARKING','VIGILANTE','VISUALIZADOR']}><ParkingDashboardView /></RoleRoute>} /> */}
          {/* <Route path="parking/solicitudes" element={<RoleRoute roles={['ADMIN_PARKING','VIGILANTE']}><ParkingSolicitudesView /></RoleRoute>} /> */}
          {/* <Route path="parking/admin" element={<RoleRoute roles={['ADMIN_PARKING']}><ParkingAdminView /></RoleRoute>} /> */}
          {/* <Route path="parking/lpr"   element={<RoleRoute roles={['ADMIN_PARKING']}><ParkingLPRView /></RoleRoute>} /> */}

          {/* ⏳ Sprint 5-6 — HSE */}
          {/* <Route path="hse" element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE','VIGILANTE','VISUALIZADOR']}><HSEDashboardView /></RoleRoute>} /> */}
          {/* <Route path="hse/autorizaciones"    element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEAutorizacionesView /></RoleRoute>} /> */}
          {/* <Route path="hse/autorizaciones/:id" element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEAutorizacionDetalle /></RoleRoute>} /> */}
          {/* <Route path="hse/vigilante"  element={<RoleRoute roles={['VIGILANTE','COORD_HSE','ADMIN_HSE']}><HSEVigilanteView /></RoleRoute>} /> */}
          {/* <Route path="hse/planillas"  element={<RoleRoute roles={['ADMIN_HSE','COORD_HSE']}><HSEPlanillasView /></RoleRoute>} /> */}

          {/* ⏳ Sprint 7 — NFC */}
          {/* <Route path="nfc"         element={<RoleRoute roles={['ADMIN_NFC','VISUALIZADOR']}><NFCDashboardView /></RoleRoute>} /> */}
          {/* <Route path="nfc/activos" element={<RoleRoute roles={['ADMIN_NFC']}><NFCActivosView /></RoleRoute>} /> */}
          {/* <Route path="nfc/eventos" element={<RoleRoute roles={['ADMIN_NFC']}><NFCEventosView /></RoleRoute>} /> */}

          {/* ⏳ Sprint 8 — Gestión Humana */}
          {/* <Route path="gh"              element={<RoleRoute roles={['ADMIN_GH','VISUALIZADOR']}><GHDashboardView /></RoleRoute>} /> */}
          {/* <Route path="gh/citas"        element={<RoleRoute roles={['ADMIN_GH']}><GHCitasView /></RoleRoute>} /> */}
          {/* <Route path="gh/importacion"  element={<RoleRoute roles={['ADMIN_GH']}><GHImportacionView /></RoleRoute>} /> */}

          {/* ⏳ Sprint 9 — Reportes + Config */}
          {/* <Route path="reportes" element={<RoleRoute roles={['ADMIN_GLOBAL','VISUALIZADOR']}><ReportesView /></RoleRoute>} /> */}
          {/* <Route path="config"   element={<RoleRoute roles={['ADMIN_GLOBAL']}><ConfigView /></RoleRoute>} /> */}

        </Route>

        {/* ── 404 ─────────────────────────────────────────────── */}
        <Route
          path="*"
          element={
            <div style={{ color: 'var(--text-primary)', padding: '2rem', fontFamily: 'var(--font-ui)' }}>
              404 — Página no encontrada
            </div>
          }
        />

      </Routes>
    </Suspense>
  )
}