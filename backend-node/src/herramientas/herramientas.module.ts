import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from '../auth/entities/usuario.entity';
import { Rol } from '../auth/entities/rol.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { UsuarioPermiso } from '../auth/entities/usuario-permiso.entity';
import { Perfil } from '../auth/entities/perfil.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';

import { HerramientasController } from './herramientas.controller';
import { HerramientasService } from './herramientas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Rol,
      UsuarioRol,
      UsuarioPermiso,
      Perfil,
      AuditLog,
    ]),
  ],
  controllers: [HerramientasController],
  providers: [HerramientasService],
})
export class HerramientasModule {}
