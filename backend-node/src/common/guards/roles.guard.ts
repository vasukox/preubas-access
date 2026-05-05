import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolNombre } from '../enums/rol.enum';

/**
 * Guard para control de acceso por roles.
 *
 * Equivalente a `require_role()` en Python (app/dependencies.py).
 *
 * Reglas:
 *   - ADMIN_GLOBAL siempre tiene acceso total (bypass)
 *   - El usuario debe tener AL MENOS UNO de los roles requeridos
 *
 * Uso:
 *   @Roles(RolNombre.ADMIN_HSE, RolNombre.ADMIN_GLOBAL)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Get('/hse/admin')
 *   async adminEndpoint() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolNombre[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario en el request (debería estar por JwtAuthGuard)
    if (!user || !user.roles) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'USUARIO_NO_ENCONTRADO',
          message: 'Usuario no encontrado en el contexto de la petición.',
        },
      });
    }

    // ADMIN_GLOBAL siempre tiene acceso total
    if (user.roles.includes(RolNombre.ADMIN_GLOBAL)) {
      return true;
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'SIN_PERMISOS',
          message: `No tienes permisos para esta acción. Se requiere uno de: ${requiredRoles.join(', ')}`,
        },
      });
    }

    return true;
  }
}
