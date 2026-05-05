import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GhCandidato } from './entities/gh-candidato.entity';
import { GhCita } from './entities/gh-cita.entity';
import { GhPortalToken } from './entities/gh-portal-token.entity';
import { GhAccesoVigilancia } from './entities/gh-acceso-vigilancia.entity';
import { GhImportacion } from './entities/gh-importacion.entity';
import { GhImportacionDetalle } from './entities/gh-importacion-detalle.entity';
import { GhAuditoria } from './entities/gh-auditoria.entity';
import { GhSesionInduccion } from './entities/gh-sesion-induccion.entity';
import { GhInduccionAsistencia } from './entities/gh-induccion-asistencia.entity';
import { GhMaestroDotacion } from './entities/gh-maestro-dotacion.entity';
import { GhDotacionEntrega } from './entities/gh-dotacion-entrega.entity';
import { GhDotacionEntregaDetalle } from './entities/gh-dotacion-entrega-detalle.entity';
import { GhController } from './gh.controller';
import { GhService } from './gh.service';

/**
 * GhModule — registra todas las entidades del módulo de Gestión Humana.
 *
 * Equivalente a los imports de SQLAlchemy en `app/models/gh.py`.
 * Aún no tiene controller ni service — se implementarán en Fase 5.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GhCandidato,
      GhCita,
      GhPortalToken,
      GhAccesoVigilancia,
      GhImportacion,
      GhImportacionDetalle,
      GhAuditoria,
      GhSesionInduccion,
      GhInduccionAsistencia,
      GhMaestroDotacion,
      GhDotacionEntrega,
      GhDotacionEntregaDetalle,
    ]),
  ],
  controllers: [GhController],
  providers: [GhService],
  exports: [TypeOrmModule],
})
export class GhModule {}
