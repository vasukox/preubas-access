/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Guardas de ruta — separadas del router principal
 * para evitar warnings de TypeScript sobre exports no usados.
 *
 * Importar en AppRouter.tsx solo cuando se necesite cada guarda:
 *   import { RoleRoute, PortalRoute } from './guards'
 */

import { useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import type { RolNombre } from '@/types'

/**
 * Ruta protegida por rol — requiere sesión + al menos uno de los roles.
 * ADMIN_GLOBAL siempre tiene acceso completo a todo el sistema.
 * Si el usuario no tiene el rol requerido redirige al dashboard.
 */
export function RoleRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles: RolNombre[]
}) {
  const { isAuthenticated, hasAnyRole, hasRole } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ADMIN_GLOBAL bypasses todas las restricciones de rol
  if (hasRole('ADMIN_GLOBAL')) return <>{children}</>

  if (!hasAnyRole(roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * Ruta de portal público — accesible sin sesión mediante token UUID.
 * Usado para: portal autogestión HSE, Parking, Gestión Humana.
 *
 * La validación del token la maneja el componente internamente
 * (llama al endpoint /public/token/validate antes de renderizar).
 */
export function PortalRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
