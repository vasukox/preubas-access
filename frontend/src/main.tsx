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
    background:   '#ffffff',
    color:        '#0F172A',
    border:       '1px solid #E2E8F0',
    borderRadius: '14px',
    fontFamily:   'Inter, sans-serif',
    fontSize:     '0.84rem',
    fontWeight:   '500',
    padding:      '13px 16px',
    boxShadow:    '0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)',
    maxWidth:     '380px',
    gap:          '10px',
  },
  success: {
    style: {
      background:  '#ffffff',
      borderLeft:  '4px solid #10B981',
      paddingLeft: '14px',
    },
    iconTheme: {
      primary:   '#10B981',
      secondary: '#ffffff',
    },
  },
  error: {
    duration: 6000,
    style: {
      background:  '#ffffff',
      borderLeft:  '4px solid #EF4444',
      paddingLeft: '14px',
    },
    iconTheme: {
      primary:   '#EF4444',
      secondary: '#ffffff',
    },
  },
  loading: {
    style: {
      background:  '#ffffff',
      borderLeft:  '4px solid #3B82F6',
      paddingLeft: '14px',
    },
    iconTheme: {
      primary:   '#3B82F6',
      secondary: '#EFF6FF',
    },
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

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={toastOptions}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              animation: t.visible
                ? 'toast-enter 360ms cubic-bezier(0.175,0.885,0.32,1.275) both'
                : 'toast-exit 220ms cubic-bezier(0.4,0,1,1) forwards',
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