/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store del WebSocket de tiempo real.
 *
 * Responsabilidades:
 * - Mantener la conexión WebSocket activa
 * - Manejar reconexión automática con backoff exponencial
 * - Distribuir mensajes del servidor a los suscriptores
 * - Heartbeat PING/PONG cada 30 segundos
 *
 * Protocolo WS: ws://{host}/ws/{sede_id}?token={JWT}
 * Backoff: 1s → 2s → 4s → 8s → 30s (máximo)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { WSStatus, WSMessage, WSMessageType } from '@/types'
import { tokenStorage } from '@/services/api'

const WS_BASE_URL    = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'
const HEARTBEAT_MS   = 30_000
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 30_000]

type MessageHandler = (payload: unknown) => void

interface WSState {
  // ── Estado ──────────────────────────────────────────────────────
  status:        WSStatus
  sedeId:        number | null
  reconnectCount: number
  lastMessage:   WSMessage | null

  // ── Acciones ─────────────────────────────────────────────────────
  connect:     (sedeId: number) => void
  disconnect:  () => void
  subscribe:   (type: WSMessageType, handler: MessageHandler) => () => void
  sendMessage: (message: unknown) => void
}

// Instancias fuera del store (no son estado reactivo)
let socket:           WebSocket | null = null
let heartbeatTimer:   ReturnType<typeof setInterval> | null = null
let reconnectTimer:   ReturnType<typeof setTimeout>  | null = null
let intentionalClose = false
const handlers = new Map<WSMessageType, Set<MessageHandler>>()

function clearTimers(): void {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  if (reconnectTimer) { clearTimeout(reconnectTimer);  reconnectTimer = null }
}

export const useWSStore = create<WSState>()(
  devtools(
    (set, get) => ({
      // ── Estado inicial ─────────────────────────────────────────
      status:         'DESCONECTADO',
      sedeId:         null,
      reconnectCount: 0,
      lastMessage:    null,

      // ── Conectar ───────────────────────────────────────────────
      connect: (sedeId: number) => {
        const token = tokenStorage.getAccessToken()
        if (!token) return

        // Cerrar conexión anterior si existe
        intentionalClose = true
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.close(1000, 'Reconnecting')
        }
        intentionalClose = false
        clearTimers()

        set({ status: 'RECONECTANDO', sedeId }, false, 'ws/connect')

        const url = `${WS_BASE_URL}/ws/${sedeId}?token=${token}`
        socket = new WebSocket(url)

        socket.onopen = () => {
          set({ status: 'CONECTADO', reconnectCount: 0 }, false, 'ws/connected')

          // Iniciar heartbeat
          heartbeatTimer = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'PING' }))
            }
          }, HEARTBEAT_MS)
        }

        socket.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data as string) as WSMessage

            // Ignorar PONG del heartbeat
            if (message.type === 'PONG') return

            set({ lastMessage: message }, false, 'ws/message')

            // Distribuir a suscriptores
            const typeHandlers = handlers.get(message.type)
            typeHandlers?.forEach((handler) => handler(message.payload))

          } catch {
            console.warn('[WS] Mensaje no parseable:', event.data)
          }
        }

        socket.onerror = () => {
          if (intentionalClose) return
          set({ status: 'ERROR' }, false, 'ws/error')
        }

        socket.onclose = () => {
          clearTimers()
          if (intentionalClose) return
          const { reconnectCount, sedeId: currentSede } = get()

          if (!currentSede) return // Desconexión intencional

          // Reconexión con backoff exponencial
          const delay = BACKOFF_DELAYS[
            Math.min(reconnectCount, BACKOFF_DELAYS.length - 1)
          ]

          set(
            { status: 'RECONECTANDO', reconnectCount: reconnectCount + 1 },
            false,
            'ws/reconnecting',
          )

          reconnectTimer = setTimeout(() => {
            get().connect(currentSede)
          }, delay)
        }
      },

      // ── Desconectar ────────────────────────────────────────────
      disconnect: () => {
        intentionalClose = true
        clearTimers()
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
          socket.close(1000, 'Client disconnect')
        }
        socket = null
        handlers.clear()
        intentionalClose = false
        set(
          { status: 'DESCONECTADO', sedeId: null, reconnectCount: 0 },
          false,
          'ws/disconnect',
        )
      },

      // ── Suscribirse a un tipo de mensaje ───────────────────────
      subscribe: (type, handler) => {
        if (!handlers.has(type)) {
          handlers.set(type, new Set())
        }
        handlers.get(type)!.add(handler)

        // Retorna función de cleanup para useEffect
        return () => {
          handlers.get(type)?.delete(handler)
        }
      },

      // ── Enviar mensaje ─────────────────────────────────────────
      sendMessage: (message) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message))
        }
      },
    }),
    { name: 'KOAJWSStore' },
  ),
)