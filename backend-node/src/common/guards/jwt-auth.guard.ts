import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard principal de autenticación JWT.
 *
 * Equivalente a `get_current_user` en Python (app/dependencies.py).
 *
 * Flujo:
 *   1. Si la ruta tiene @Public() → skip auth
 *   2. Extrae Bearer token del header Authorization
 *   3. Valida token con JWT Strategy
 *   4. Si es válido → attach usuario al request
 *   5. Si es inválido → 401 Unauthorized
 *
 * Uso en controllers:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('/perfil')
 *   async getPerfil(@Request() req) {
 *     return req.user; // Usuario autenticado
 *   }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Si la ruta es pública, saltar autenticación
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Si hay error o no hay usuario → 401
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          success: false,
          error: {
            code: 'TOKEN_INVALIDO',
            message: 'El token es inválido o ha expirado.',
          },
        })
      );
    }
    return user;
  }
}
