import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Entities comunes ────────────────────────────────────────────────────────
import { Sede } from '../sede/entities/sede.entity';

// ── Entities HSE — catálogos ────────────────────────────────────────────────
import { CatEps } from './entities/cat-eps.entity';
import { CatArl } from './entities/cat-arl.entity';
import { CatAfp } from './entities/cat-afp.entity';
import { CatNormaSeguridad } from './entities/cat-norma-seguridad.entity';

// ── Entities HSE — núcleo ────────────────────────────────────────────────────
import { HseAutorizacion } from './entities/hse-autorizacion.entity';
import { HseContratista } from './entities/hse-contratista.entity';

// ── Entities HSE — autogestión ───────────────────────────────────────────────
import { HseClasificacion } from './entities/hse-clasificacion.entity';
import { HseSegSocial } from './entities/hse-seg-social.entity';
import { HseCertificaciones } from './entities/hse-certificaciones.entity';
import { HseExamenMedico } from './entities/hse-examen-medico.entity';
import { HseContactoEmergencia } from './entities/hse-contacto-emergencia.entity';
import { HseAceptacionNormas } from './entities/hse-aceptacion-normas.entity';

// ── Entities HSE — operación y control ──────────────────────────────────────
import { HseAcceso } from './entities/hse-acceso.entity';
import { HseCumplimiento } from './entities/hse-cumplimiento.entity';
import { HseCumplimientoItem } from './entities/hse-cumplimiento-item.entity';
import { HseExcepcion } from './entities/hse-excepcion.entity';
import { HseHistorial } from './entities/hse-historial.entity';

import { HseController } from './hse.controller';
import { HseService } from './hse.service';

/**
 * HseModule — registra todas las entidades del módulo HSE en TypeORM.
 *
 * Equivalente a los imports de SQLAlchemy en `app/models/hse.py`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sede,
      // Catálogos
      CatEps,
      CatArl,
      CatAfp,
      CatNormaSeguridad,
      // Núcleo
      HseAutorizacion,
      HseContratista,
      // Autogestión (wizard 8 pasos)
      HseClasificacion,
      HseSegSocial,
      HseCertificaciones,
      HseExamenMedico,
      HseContactoEmergencia,
      HseAceptacionNormas,
      // Operación
      HseAcceso,
      HseCumplimiento,
      HseCumplimientoItem,
      // Control
      HseExcepcion,
      HseHistorial,
    ]),
  ],
  controllers: [HseController],
  providers: [HseService],
  exports: [TypeOrmModule],
})
export class HseModule {}
