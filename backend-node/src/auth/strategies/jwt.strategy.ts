import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '../../config/config.service';
import { Usuario } from '../entities/usuario.entity';

/**
 * Payload del JWT — coincide con lo que crea AuthService al generar tokens.
 */
interface JwtPayload {
  sub: number; // usuario_id
  email: string;
  roles: string[];
  dcp: boolean; // debe_cambiar_password
  iat?: number;
  exp?: number;
}

/**
 * Usuario con permisos — lo que el strategy retorna al validar.
 * Se adjunta a `request.user` en cada request autenticado.
 */
export interface UsuarioConPermisos {
  id: number;
  email: string;
  roles: string[];
  debeCambiarPassword: boolean;
  permisos?: {
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  };
}

/**
 * Estrategia JWT para Passport.
 *
 * Equivalente a `verify_access_token()` en Python (app/utils/jwt.py).
 *
 * Flujo:
 *   1. Extrae token del header Authorization: Bearer <token>
 *   2. Verifica firma con JWT_SECRET
 *   3. Verifica expiración
 *   4. Busca el usuario en BD para confirmar que existe y está activo
 *   5. Retorna UsuarioConPermisos → queda en req.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioConPermisos> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub },
      relations: ['permisos'],
    });

    if (!usuario) {
      throw new UnauthorizedException({
        code: 'USUARIO_NO_ENCONTRADO',
        message: 'El usuario asociado a este token no existe.',
      });
    }

    if (!usuario.activo) {
      throw new UnauthorizedException({
        code: 'USUARIO_INACTIVO',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
    }

    return {
      id: usuario.id,
      email: usuario.email,
      roles: payload.roles,
      debeCambiarPassword: payload.dcp,
      permisos: usuario.permisos
        ? {
            puedeVer: usuario.permisos.puedeVer,
            puedeCrear: usuario.permisos.puedeCrear,
            puedeEditar: usuario.permisos.puedeEditar,
            puedeEliminar: usuario.permisos.puedeEliminar,
          }
        : undefined,
    };
  }
}
