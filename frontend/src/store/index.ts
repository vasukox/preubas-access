/**
 * Barrel export de todos los stores de Zustand.
 * Importar desde: import { useAuthStore, useSedeStore } from '@/store'
 */

export { useAuthStore }                  from './authStore'
export { useSedeStore }                  from './sedeStore'
export { useWSStore }                    from './wsStore'
export { useAlertsStore }                from './alertsStore'
export type { Alerta, AlertaSeveridad }  from './alertsStore'
export { useUIStore }                    from './uiStore'
export type { ModalConfig, DrawerConfig } from './uiStore'
export { useGHStore }                    from './ghStore'