/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store de autenticación.
 *
 * Responsabilidades:
 * - Guardar el usuario autenticado y sus roles
 * - Manejar login, logout y refresh de sesión
 * - Proveer helpers de verificación de roles
 * - Persistir la sesión en localStorage via tokenStorage
 *
 * Patrón:
 *   Todos los componentes que necesiten saber si el usuario
 *   está autenticado o qué roles tiene usan este store.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UsuarioMe, RolNombre } from '@/types'
import { tokenStorage } from '@/services/api'

interface AuthState {
  // ── Estado ──────────────────────────────────────────────────────
  usuario:         UsuarioMe | null
  isAuthenticated: boolean
  isLoading:       boolean   // Verificando sesión al arrancar la app

  // ── Acciones ─────────────────────────────────────────────────────
  setUsuario:   (usuario: UsuarioMe, accessToken: string, refreshToken: string) => void
  clearSession: () => void
  setLoading:   (loading: boolean) => void

  // ── Helpers de roles ──────────────────────────────────────────────
  hasRole:    (role: RolNombre) => boolean
  hasAnyRole: (roles: RolNombre[]) => boolean
  isAdmin:    () => boolean
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // ── Estado inicial ─────────────────────────────────────────
      usuario:         null,
      isAuthenticated: false,
      isLoading:       true,   // True al arrancar — verifica si hay sesión

      // ── Acciones ───────────────────────────────────────────────
      setUsuario: (usuario, accessToken, refreshToken) => {
        tokenStorage.setTokens(accessToken, refreshToken)
        set(
          { usuario, isAuthenticated: true, isLoading: false },
          false,
          'auth/setUsuario',
        )
      },

      clearSession: () => {
        tokenStorage.clearTokens()
        set(
          { usuario: null, isAuthenticated: false, isLoading: false },
          false,
          'auth/clearSession',
        )
      },

      setLoading: (isLoading) => set({ isLoading }, false, 'auth/setLoading'),

      // ── Helpers de roles ───────────────────────────────────────
      hasRole: (role) => {
        const { usuario } = get()
        if (!usuario) return false
        return usuario.roles.some((r) => r.rol.nombre === role)
      },

      hasAnyRole: (roles) => {
        const { usuario } = get()
        if (!usuario) return false
        const userRoles = new Set(usuario.roles.map((r) => r.rol.nombre))
        return roles.some((role) => userRoles.has(role))
      },

      isAdmin: () => {
        const { hasRole } = get()
        return hasRole('ADMIN_GLOBAL')
      },
    }),
    { name: 'KOAJAuthStore' },
  ),
)