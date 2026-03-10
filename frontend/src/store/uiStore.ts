/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store de UI — estado visual global de la aplicación.
 *
 * Decisión de diseño:
 * - SIN persist (Opción B del code review)
 * - React.ReactNode NO es serializable — no puede ir en localStorage
 * - Solo sidebarCollapsed merece persistirse, se maneja con
 *   una clave directa en localStorage fuera de Zustand
 * - Modal y Drawer usan un registro por tipo (drawerType/modalType)
 *   en lugar de guardar el nodo React directamente
 *
 * Responsabilidades:
 * - Estado del sidebar (colapsado/expandido)
 * - Modal global (un solo modal activo a la vez)
 * - Drawer global (un solo drawer activo a la vez)
 * - Loading global (bloquea la UI durante operaciones críticas)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ── Tipos de modal registrados ────────────────────────────────────
// Agregar aquí cada nuevo tipo de modal que se necesite en el sistema
export type ModalType =
  | 'CONFIRMAR_ACCION'
  | 'APROBAR_SOLICITUD'
  | 'RECHAZAR_SOLICITUD'
  | 'GENERAR_ENLACE'
  | 'VER_FOTOS'
  | 'CAMBIAR_SEDE'

// ── Tipos de drawer registrados ───────────────────────────────────
// Agregar aquí cada nuevo tipo de drawer que se necesite en el sistema
export type DrawerType =
  | 'PERSONA_DETALLE'
  | 'VEHICULO_DETALLE'
  | 'ALERTA_PANEL'
  | 'AUTORIZACION_DETALLE'
  | 'ACTIVO_DETALLE'

// ── Configuración del modal ───────────────────────────────────────
export interface ModalConfig {
  modalType: ModalType
  title:     string
  params?:   Record<string, unknown>
  onConfirm?: () => void
  onCancel?:  () => void
}

// ── Configuración del drawer ──────────────────────────────────────
export interface DrawerConfig {
  drawerType: DrawerType
  title:      string
  width?:     'sm' | 'md' | 'lg' | 'xl'
  params?:    Record<string, unknown>
  onClose?:   () => void
}

// ── Estado + acciones ─────────────────────────────────────────────
interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar:    () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Modal global
  modal:     ModalConfig | null
  openModal: (config: ModalConfig) => void
  closeModal: () => void

  // Drawer global
  drawer:     DrawerConfig | null
  openDrawer: (config: DrawerConfig) => void
  closeDrawer: () => void

  // Loading global — bloquea la UI durante operaciones críticas
  globalLoading:    boolean
  setGlobalLoading: (loading: boolean) => void
}

// ── Helpers de persistencia manual ───────────────────────────────
// Solo sidebarCollapsed se persiste — directamente en localStorage
const SIDEBAR_KEY = 'koaj:sidebar-collapsed'

function loadSidebarState(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  } catch {
    return false
  }
}

function saveSidebarState(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
  } catch {
    // localStorage puede fallar en modo incógnito — ignorar
  }
}

// ── Store ─────────────────────────────────────────────────────────
export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // ── Sidebar ──────────────────────────────────────────────
      sidebarCollapsed: loadSidebarState(),

      toggleSidebar: () =>
        set(
          (state) => {
            const next = !state.sidebarCollapsed
            saveSidebarState(next)
            return { sidebarCollapsed: next }
          },
          false,
          'ui/toggleSidebar',
        ),

      setSidebarCollapsed: (collapsed) => {
        saveSidebarState(collapsed)
        set({ sidebarCollapsed: collapsed }, false, 'ui/setSidebarCollapsed')
      },

      // ── Modal ─────────────────────────────────────────────────
      modal: null,

      openModal: (config) =>
        set({ modal: config }, false, 'ui/openModal'),

      closeModal: () =>
        set({ modal: null }, false, 'ui/closeModal'),

      // ── Drawer ────────────────────────────────────────────────
      drawer: null,

      openDrawer: (config) =>
        set({ drawer: config }, false, 'ui/openDrawer'),

      closeDrawer: () =>
        set({ drawer: null }, false, 'ui/closeDrawer'),

      // ── Loading global ────────────────────────────────────────
      globalLoading: false,

      setGlobalLoading: (loading) =>
        set({ globalLoading: loading }, false, 'ui/setGlobalLoading'),
    }),
    { name: 'koaj-ui' },
  ),
)