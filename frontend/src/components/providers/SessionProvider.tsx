/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Verifica y restaura la sesión al arrancar la app.
 */

import { useEffect } from 'react'
import { useAuthStore } from '@/store'
import { tokenStorage, get } from '@/services/api'
import type { UsuarioMe } from '@/types'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { setUsuario, clearSession, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    async function restoreSession(): Promise<void> {
      const accessToken  = tokenStorage.getAccessToken()
      const refreshToken = tokenStorage.getRefreshToken()

      if (!accessToken || !refreshToken) {
        setLoading(false)
        return
      }

      try {
        const usuario = await get<UsuarioMe>('/auth/me')
        setUsuario(usuario, accessToken, refreshToken)
      } catch {
        clearSession()
      }
    }

    restoreSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-base)', gap: '24px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '1.5rem',
          fontWeight: 700, letterSpacing: '0.2em', color: 'var(--primary-400)',
        }}>
          KOAJ ACCESS
        </div>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid var(--border-default)',
          borderTop: '2px solid var(--primary-500)',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: '0.8rem',
          color: 'var(--text-muted)', letterSpacing: '0.05em',
        }}>
          Verificando sesión...
        </p>
      </div>
    )
  }

  return <>{children}</>
}