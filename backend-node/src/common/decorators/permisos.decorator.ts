import { SetMetadata } from '@nestjs/common';

/**
 * Key usada por el PermisosGuard para leer los permisos requeridos.
 */
export const PERMISOS_KEY = 'permisos';

/**
 * Operaciones válidas para permisos granulares.
 * Equivalentes a `require_permiso()` en Python (app/dependencies.py).
 */
export type Operacion = 'ver' | 'crear' | 'editar' | 'eliminar';

/**
 * Decorador para restringir acceso por permiso granular.
 *
 * Verifica que el usuario tenga el permiso en la tabla usuario_permisos.
 * ADMIN_GLOBAL siempre tiene acceso total (bypass automático).
 *
 * Uso:
 *   @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
 *   @Permisos('eliminar')
 *   @Delete('/hse/autorizaciones/:id')
 *   async eliminarAutorizacion() { ... }
 */
export const Permisos = (...operaciones: Operacion[]) =>
  SetMetadata(PERMISOS_KEY, operaciones);
