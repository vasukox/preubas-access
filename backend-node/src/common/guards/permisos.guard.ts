import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY, Operacion } from '../decorators/permisos.decorator';
import { RolNombre } from '../enums/rol.enum';

/**
 * Guard para control de acceso por permisos granulares.
 *
 * Equivalente a `require_permiso()` en Python (app/dependencies.py).
 *
 * Verifica que el usuario tenga el permiso en la tabla usuario_permisos.
 * ADMIN_GLOBAL siempre tiene acceso total (bypass automático).
 *
 * Uso:
 *   @Roles(RolNombre.ADMIN_HSE, RolNombre.GESTION_HSE)
 *   @Permisos('eliminar')
 *   @UseGuards(JwtAuthGuard, RolesGuard, PermisosGuard)
 *   @Delete('/hse/autorizaciones/:id')
 *   async eliminarAutorizacion() { ... }
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermisos = this.reflector.getAllAndOverride<Operacion[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermisos || requiredPermisos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario en el request
    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado en el contexto de la petición.',
        },
      });
    }

    // ADMIN_GLOBAL siempre tiene acceso total (bypass)
    if (user.roles?.includes(RolNombre.ADMIN_GLOBAL)) {
      return true;
    }

    // Verificar permisos granulares
    const permisos = user.permisos;

    if (!permisos) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'SIN_PERMISOS_CONFIGURADOS',
          message: 'Tu cuenta no tiene permisos configurados. Contacta al administrador.',
        },
      });
    }

    // Verificar cada permiso requerido
    for (const operacion of requiredPermisos) {
      const campoPermiso = `puede${this.capitalize(operacion)}`;

      if (!permisos[campoPermiso]) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'PERMISO_DENEGADO',
            message: `No tienes permiso para '${operacion}' en este módulo.`,
          },
        });
      }
    }

    return true;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
