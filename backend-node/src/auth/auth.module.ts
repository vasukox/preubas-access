import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigService } from '../config/config.service';

import { Usuario } from './entities/usuario.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Rol } from './entities/rol.entity';
import { UsuarioPermiso } from './entities/usuario-permiso.entity';
import { Perfil } from './entities/perfil.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Sede } from '../sede/entities/sede.entity';

/**
 * Módulo de autenticación.
 *
 * Configura JWT, Passport strategy, y registra todas las entities de usuario.
 */
@Module({
  imports: [
    // TypeORM para acceso a entidades de auth
    TypeOrmModule.forFeature([
      Usuario,
      UsuarioRol,
      Rol,
      UsuarioPermiso,
      Perfil,
      RefreshToken,
      AuditLog,
      Sede,
    ]),

    // JWT Module con configuración desde ConfigService
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          algorithm: config.jwtAlgorithm as 'HS256',
          expiresIn: config.jwtAccessExpireMinutes * 60,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
