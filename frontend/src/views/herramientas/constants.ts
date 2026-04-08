import { Eye, PenSquare, PlusCircle, Trash2 } from 'lucide-react'
import type { PermisosUsuario } from '@/services/herramientas.service'
import type { RolNombre } from '@/types'

export type VistaHerramientas = 'inicio' | 'crear' | 'usuarios' | 'roles' | 'auditoria'

export interface PermisosUI {
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

export const PERMISOS_LABELS: Array<{ key: keyof PermisosUI; label: string }> = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
]

export const PERMISOS_BD_LABELS: Array<{ key: keyof PermisosUsuario; label: string }> = [
  { key: 'puede_ver', label: 'Ver' },
  { key: 'puede_crear', label: 'Crear' },
  { key: 'puede_editar', label: 'Editar' },
  { key: 'puede_eliminar', label: 'Eliminar' },
]

export const DEFAULT_PERMISOS: PermisosUI = {
  ver: true,
  crear: false,
  editar: false,
  eliminar: false,
}

export const PERMISSION_META: Record<
  keyof PermisosUI,
  { descripcion: string; color: string; icon: React.ComponentType<{ size?: number; color?: string }> }
> = {
  ver: {
    descripcion: 'Consultar información y paneles habilitados.',
    color: 'var(--info-500)',
    icon: Eye,
  },
  crear: {
    descripcion: 'Registrar nuevos elementos del flujo.',
    color: 'var(--success-500)',
    icon: PlusCircle,
  },
  editar: {
    descripcion: 'Actualizar datos existentes del módulo.',
    color: 'var(--primary-500)',
    icon: PenSquare,
  },
  eliminar: {
    descripcion: 'Eliminar registros permitidos por política.',
    color: 'var(--danger-500)',
    icon: Trash2,
  },
}

export const roleCapabilities: Record<RolNombre, PermisosUI> = {
  ADMIN_GLOBAL:      { ver: true, crear: true,  editar: true,  eliminar: true  },
  ADMIN_HSE:         { ver: true, crear: true,  editar: true,  eliminar: false },
  GESTION_HSE:       { ver: true, crear: true,  editar: true,  eliminar: false },
  VIGILANTE_HSE:     { ver: true, crear: false, editar: true,  eliminar: false },
  ADMIN_PARKING:     { ver: true, crear: true,  editar: true,  eliminar: false },
  VIGILANTE_PARKING: { ver: true, crear: false, editar: true,  eliminar: false },
  ADMIN_NFC:         { ver: true, crear: true,  editar: true,  eliminar: false },
  ADMIN_GH:          { ver: true, crear: true,  editar: true,  eliminar: false },
  VISUALIZADOR:      { ver: true, crear: false, editar: false, eliminar: false },
}

export const ACCIONES_AUDITORIA: Record<string, string> = {
  CREAR_USUARIO:        'Crear usuario',
  ACTUALIZAR_USUARIO:   'Actualizar usuario',
  DESACTIVAR_USUARIO:   'Desactivar usuario',
  ASIGNAR_ROL:          'Asignar rol',
  QUITAR_ROL:           'Quitar rol',
  ACTUALIZAR_PERMISOS:  'Actualizar permisos',
  RESETEAR_PASSWORD:    'Resetear contraseña',
}

export const HSE_ROLES_ACTIVOS: RolNombre[] = [
  'ADMIN_HSE',
  'GESTION_HSE',
  'VIGILANTE_HSE',
  'VISUALIZADOR',
  'ADMIN_GLOBAL',
]

export const HSE_SUBROLES_POR_ROL: Partial<Record<RolNombre, RolNombre[]>> = {
  ADMIN_GLOBAL: ['ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE', 'VISUALIZADOR'],
  ADMIN_HSE: ['GESTION_HSE', 'VIGILANTE_HSE', 'VISUALIZADOR'],
  GESTION_HSE: ['VISUALIZADOR'],
}

export const HSE_SUBMODULO_ROLES: Array<{ submodulo: string; roles: RolNombre[] }> = [
  { submodulo: 'Dashboard HSE', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE', 'VISUALIZADOR'] },
  { submodulo: 'Panel General', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'GESTION_HSE', 'VISUALIZADOR'] },
  { submodulo: 'Gestión', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'GESTION_HSE'] },
  { submodulo: 'Vigilante', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'VIGILANTE_HSE'] },
  { submodulo: 'Excepciones', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'GESTION_HSE'] },
  { submodulo: 'Cumplimiento', roles: ['ADMIN_GLOBAL', 'ADMIN_HSE', 'GESTION_HSE'] },
]

export function badgeColor(color: string): React.CSSProperties {
  return {
    background: 'var(--bg-raised)',
    border: `1px solid ${color}55`,
    color,
  }
}

export const validarPassword = (password: string): string | null => {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula.'
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula.'
  if (!/\d/.test(password)) return 'La contraseña debe incluir un número.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir un carácter especial.'
  return null
}
