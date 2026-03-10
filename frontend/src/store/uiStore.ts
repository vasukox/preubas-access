/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Store de estado de la interfaz de usuario.
 *
 * Responsabilidades:
 * - Estado del sidebar (expandido / colapsado)
 * - Modal global (confirmaciones, alertas)
 * - Drawer global (paneles laterales de detalle)
 * - Estado de carga global
 *
 * Patrón:
 *   Los componentes que necesiten abrir un modal o drawer
 *   no lo manejan localmente — usan este store global.
 *   Así se evita prop drilling y se centraliza el UI state.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ── Tipos de UI ───────────────────────────────────────────────────

export interface ModalConfig {
  title:       string
  message:     string
  confirmText?: string
  cancelText?:  string
  variant?:    'danger' | 'warning' | 'info'
  onConfirm:   () => void | Promise<void>
  onCancel?:   () => void
}

export interface DrawerConfig {
  title:     string
  width?:    'sm' | 'md' | 'lg' | 'xl'
  content:   React.ReactNode
  onClose?:  () => void
}

interface UIState {
  // ── Sidebar ───────────────────────────────────────────────────
  sidebarCollapsed: boolean

  // ── Modal de confirmación global ──────────────────────────────
  modal:     ModalConfig | null
  modalOpen: boolean

  // ── Drawer global ─────────────────────────────────────────────
  drawer:     DrawerConfig | null
  drawerOpen: boolean

  // ── Loading global (para operaciones largas) ──────────────────
  globalLoading: boolean

  // ── Acciones ──────────────────────────────────────────────────
  toggleSidebar:   () => void
  setSidebar:      (collapsed: boolean) => void

  openModal:       (config: ModalConfig) => void
  closeModal:      () => void

  openDrawer:      (config: DrawerConfig) => void
  closeDrawer:     () => void

  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // ── Estado inicial ───────────────────────────────────────
        sidebarCollapsed: false,
        modal:            null,
        modalOpen:        false,
        drawer:           null,
        drawerOpen:       false,
        globalLoading:    false,

        // ── Sidebar ──────────────────────────────────────────────
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            false,
            'ui/toggleSidebar',
          ),

        setSidebar: (sidebarCollapsed) =>
          set({ sidebarCollapsed }, false, 'ui/setSidebar'),

        // ── Modal ────────────────────────────────────────────────
        openModal: (modal) =>
          set({ modal, modalOpen: true }, false, 'ui/openModal'),

        closeModal: () =>
          set({ modalOpen: false }, false, 'ui/closeModal'),

        // ── Drawer ───────────────────────────────────────────────
        openDrawer: (drawer) =>
          set({ drawer, drawerOpen: true }, false, 'ui/openDrawer'),

        closeDrawer: () =>
          set({ drawerOpen: false }, false, 'ui/closeDrawer'),

        // ── Global loading ────────────────────────────────────────
        setGlobalLoading: (globalLoading) =>
          set({ globalLoading }, false, 'ui/setGlobalLoading'),
      }),
      {
        name: 'koaj-ui-store',
        // Solo persistir preferencia del sidebar
        partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      },
    ),
    { name: 'KOAJUIStore' },
  ),
)