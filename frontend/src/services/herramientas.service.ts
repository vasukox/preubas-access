/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Servicio HTTP del módulo Herramientas
 * Solo accesible por ADMIN_GLOBAL.
 */

import { get, post, put, del } from './api'
import type { RolNombre } from '@/types'

export interface PermisosUsuario {
  puede_ver:      boolean
  puede_crear:    boolean
  puede_editar:   boolean
  puede_eliminar: boolean
}

export interface UsuarioSistema {
  id:               number
  email:            string
  nombre_completo:  string
  numero?:          string | null
  direccion?:       string | null
  activo:           boolean
  ultimo_login:     string | null
  roles:            { id: number; nombre: RolNombre }[]
  permisos:         PermisosUsuario
  sede_asignada_id:     number | null
  sede_asignada:        { id: number; nombre: string; ciudad: string } | null
  sedes_asignadas_ids?: number[]
  sedes_asignadas?:     { id: number; nombre: string; ciudad: string }[]
}

export interface RolSistema {
  id:          number
  nombre:      RolNombre
  descripcion: string
  color:       string
  modulos:     string[]
  grupos:      {
    grupo:          string
    modulo:         string
    submodulos:     string[]
    puede_eliminar: string[]
  }[]
}

export interface UsuarioCreateRequest {
  email:                 string
  nombres:               string
  apellidos:             string
  numero:                string
  direccion:             string
  rol_nombre?:           RolNombre
  roles_nombres?:        RolNombre[]
  password:              string
  password_confirmacion: string
  firma_creador:         string
  sede_asignada_id?:      number | null
  sedes_asignadas_ids?:   number[]
  permisos?: {
    ver:      boolean
    crear:    boolean
    editar:   boolean
    eliminar: boolean
  }
}

export interface UsuarioUpdateRequest {
  nombre_completo?: string
  numero?:          string
  direccion?:       string
  activo?:          boolean
}

export interface ActualizarPermisosRequest {
  puede_ver:      boolean
  puede_crear:    boolean
  puede_editar:   boolean
  puede_eliminar: boolean
}

export interface ResetPasswordRequest {
  password_nueva: string
  password_confirmacion: string
  forzar_cambio?: boolean
}

export interface AuditLogEntry {
  id:           number
  actor_id:     number | null
  actor_nombre: string
  accion:       string
  entidad:      string
  entidad_id:   number | null
  descripcion:  string | null
  fecha:        string | null
}

export const herramientasService = {
  // ── Roles ──────────────────────────────────────────────────────
  listarRoles: () =>
    get<RolSistema[]>('/herramientas/roles'),

  // ── Usuarios ───────────────────────────────────────────────────
  listarUsuarios: () =>
    get<UsuarioSistema[]>('/herramientas/usuarios'),

  crearUsuario: (data: UsuarioCreateRequest) =>
    post<UsuarioSistema>('/herramientas/usuarios', data),

  actualizarUsuario: (id: number, data: UsuarioUpdateRequest) =>
    put<UsuarioSistema>(`/herramientas/usuarios/${id}`, data),

  eliminarUsuario: (id: number) =>
    del<void>(`/herramientas/usuarios/${id}`),

  // ── Permisos granulares ────────────────────────────────────────
  actualizarPermisos: (id: number, data: ActualizarPermisosRequest) =>
    put<UsuarioSistema>(`/herramientas/usuarios/${id}/permisos`, data),

  // ── Roles de usuario ───────────────────────────────────────────
  asignarRol: (usuarioId: number, rolNombre: RolNombre, sedesAsignadasIds?: number[]) =>
    post<UsuarioSistema>(`/herramientas/usuarios/${usuarioId}/roles`, {
      rol_nombre: rolNombre,
      ...(sedesAsignadasIds?.length ? { sedes_asignadas_ids: sedesAsignadasIds } : {}),
    }),

  quitarRol: (usuarioId: number, rolNombre: RolNombre) =>
    del<UsuarioSistema>(`/herramientas/usuarios/${usuarioId}/roles/${rolNombre}`),

  resetPassword: (usuarioId: number, data: ResetPasswordRequest) =>
    put<UsuarioSistema>(`/herramientas/usuarios/${usuarioId}/password`, data),

  // ── Auditoría ──────────────────────────────────────────────────
  listarAuditoria: (params?: { limit?: number; offset?: number; accion?: string }) => {
    const query = new URLSearchParams()
    if (params?.limit  !== undefined) query.set('limit',  String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    if (params?.accion)               query.set('accion', params.accion)
    const qs = query.toString()
    return get<AuditLogEntry[]>(`/herramientas/auditoria${qs ? `?${qs}` : ''}`)
  },
}
