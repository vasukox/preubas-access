import { SetMetadata } from '@nestjs/common';
import { RolNombre } from '../enums/rol.enum';

/**
 * Key usada por el RolesGuard para leer los roles permitidos.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir acceso a roles específicos.
 *
 * Equivalente a `require_role()` en Python (app/dependencies.py).
 *
 * Uso:
 *   @Roles(RolNombre.ADMIN_HSE, RolNombre.ADMIN_GLOBAL)
 *   @Get('/hse/autorizaciones')
 *   async listarAutorizaciones() { ... }
 *
 * Nota: ADMIN_GLOBAL siempre tiene acceso — el guard lo maneja.
 */
export const Roles = (...roles: RolNombre[]) => SetMetadata(ROLES_KEY, roles);
