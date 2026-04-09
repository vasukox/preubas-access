/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Cliente HTTP global basado en Axios.
 *
 * Responsabilidades:
 * - Instancia Axios configurada con la base URL del backend
 * - Interceptor de request: inyecta el Bearer token automáticamente
 * - Interceptor de response: maneja errores globalmente
 * - Refresh automático de token cuando recibe 401
 * - Cola de requests fallidos durante el refresh (no los pierde)
 *
 * Patrón:
 *   Nadie importa Axios directamente. Todos los módulos
 *   importan { api } desde aquí.
 *   Los hooks de TanStack Query llaman a las funciones de este archivo.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse, ApiError, TokenResponse } from '@/types'
import { useWSStore } from '@/store'

// ── Constantes ────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_PREFIX = '/api/v1'

// ── Instancia principal ───────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ── Storage helpers ───────────────────────────────────────────────
// Centralizados aquí para que nadie más toque localStorage directamente.

const TOKEN_KEY         = 'koaj_access_token'
const REFRESH_TOKEN_KEY = 'koaj_refresh_token'

export const tokenStorage = {
  getAccessToken:  (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// ── Cola de requests fallidos durante el refresh ──────────────────
// Cuando el access token expira y hay múltiples requests en vuelo,
// todos fallan con 401. En lugar de disparar N refreshes simultáneos,
// los encolamos y los resolvemos cuando el refresh termina.

type QueueItem = {
  resolve: (token: string) => void
  reject:  (error: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

// ── Interceptor de REQUEST ────────────────────────────────────────
// Inyecta el Bearer token en cada request autenticado.

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Interceptor de RESPONSE ───────────────────────────────────────
// Maneja errores 401 (token expirado) con refresh automático.
// Maneja otros errores globalmente.

api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Solo manejar 401 de requests que NO sean el propio login o refresh
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // Si ya hay un refresh en progreso, encolar este request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      // Marcar que estamos refrescando para encolar los siguientes
      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        // No hay refresh token — forzar logout
        tokenStorage.clearTokens()
        processQueue(error, null)
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Llamar al endpoint de refresh con una instancia limpia
        // (sin interceptores para evitar loops)
        const response = await axios.post<ApiResponse<TokenResponse>>(
          `${BASE_URL}${API_PREFIX}/auth/refresh`,
          { refresh_token: refreshToken },
        )

        const { access_token, refresh_token: newRefreshToken } =
          response.data.data

        // Guardar los nuevos tokens
        tokenStorage.setTokens(access_token, newRefreshToken)

        // Actualizar el header de la instancia para futuros requests
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`

        // Avisar al WS que ahora hay un token válido para que se conecte
        useWSStore.getState().reconnectWithNewToken()

        // Resolver todos los requests encolados con el nuevo token
        processQueue(null, access_token)

        // Reintentar el request original
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)

      } catch (refreshError) {
        // El refresh también falló — sesión expirada definitivamente
        processQueue(refreshError, null)
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    // Para otros errores, rechazar con el formato estándar del backend
    return Promise.reject(error)
  },
)

// ═══════════════════════════════════════════════════════════════════
// HELPERS DE REQUEST
// Funciones tipadas para GET, POST, PUT, PATCH, DELETE.
// Todos los servicios usan estas funciones.
// ═══════════════════════════════════════════════════════════════════

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.get<ApiResponse<T>>(url, config)
  return response.data.data
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.put<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.patch<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function del<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.delete<ApiResponse<T>>(url, config)
  return response.data.data
}

// ── Upload de archivos ────────────────────────────────────────────
// Para endpoints que reciben multipart/form-data
// (fotos de vehículos, certificados HSE, planillas PILA, etc.)

export async function upload<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  const response = await api.post<ApiResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress(percent)
      }
    },
  })
  return response.data.data
}

// ── Extractor de mensaje de error ─────────────────────────────────
// Convierte un error de Axios al mensaje legible para el usuario.
// Usado en los catch de los hooks de TanStack Query.

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined
    if (data?.error?.message) {
      return data.error.message
    }
    if (error.response?.status === 404) return 'Recurso no encontrado.'
    if (error.response?.status === 403) return 'No tienes permisos para esta acción.'
    if (error.response?.status === 500) return 'Error interno del servidor. Intenta de nuevo.'
    if (error.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Verifica tu conexión.'
    if (error.code === 'ERR_NETWORK') return 'Sin conexión al servidor. Verifica tu red.'
  }
  return 'Ocurrió un error inesperado.'
}

export function getErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined
    return data?.error?.code ?? null
  }
  return null
}

// ── Descarga de archivos con autenticación ────────────────────────
// Para endpoints que retornan archivos binarios (PDFs, imágenes)
// protegidos por Bearer token.

export async function fetchBlob(url: string): Promise<Blob> {
  const response = await api.get(url, { responseType: 'blob' })
  return response.data as Blob
}