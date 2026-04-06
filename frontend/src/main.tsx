/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Punto de entrada principal del frontend.
 *
 * Responsabilidades:
 * - Configurar TanStack Query con defaults globales
 * - Configurar React Router
 * - Configurar React Hot Toast
 * - Verificar sesión activa al arrancar
 * - Renderizar la aplicación
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { Toaster, ToastBar } from 'react-hot-toast'

import { AppRouter } from '@/router/AppRouter'
import { SessionProvider } from '@/components/providers/SessionProvider'
import '@/index.css'

// ── TanStack Query — configuración global ─────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reintentar solo 1 vez en caso de error (no 3 como por defecto)
      retry: 1,

      // No refetch al volver a enfocar la ventana en desarrollo
      refetchOnWindowFocus: import.meta.env.PROD,

      // Datos considerados frescos por 30 segundos
      staleTime: 30_000,

      // Mantener datos en cache por 5 minutos
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      // No reintentar mutations fallidas
      retry: 0,
    },
  },
})

// ── Configuración de Toast ────────────────────────────────────────
const toastOptions = {
  duration: 4000,
  style: {
    background:  'var(--bg-overlay)',
    color:       'var(--text-primary)',
    border:      '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    fontFamily:  'var(--font-ui)',
    fontSize:    '0.875rem',
    padding:     '12px 16px',
    boxShadow:   'var(--shadow-lg)',
  },
  success: {
    iconTheme: {
      primary: 'var(--success-500)',
      secondary: 'var(--bg-overlay)',
    },
  },
  error: {
    iconTheme: {
      primary: 'var(--danger-500)',
      secondary: 'var(--bg-overlay)',
    },
    duration: 6000,
  },
}

// ── Root ──────────────────────────────────────────────────────────
const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root en index.html')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/*
          SessionProvider verifica si hay un token válido en localStorage
          al arrancar la app y restaura la sesión si existe.
          Muestra un splash screen mientras verifica.
        */}
        <SessionProvider>
          <AppRouter />
        </SessionProvider>
      </BrowserRouter>

      {/* Toast notifications — posición top-right */}
      <Toaster
        position="top-right"
        toastOptions={toastOptions}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              animation: t.visible
                ? 'toast-enter-right 320ms var(--transition-spring) both'
                : 'toast-exit-right 220ms ease-in forwards',
            }}
          />
        )}
      </Toaster>

      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  </StrictMode>,
)