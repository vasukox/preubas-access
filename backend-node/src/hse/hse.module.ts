import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaModule } from '../persona/persona.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { Usuario } from '../auth/entities/usuario.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { Rol } from '../auth/entities/rol.entity';

// ── Entities comunes ────────────────────────────────────────────────────────
import { Sede } from '../sede/entities/sede.entity';
import { ConfigTiemposContratista } from '../config-koaj/entities/config-tiempos-contratista.entity';

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
import { HseSolicitudArchivado } from './entities/hse-solicitud-archivado.entity';

import { HseController } from './hse.controller';
import { HseService } from './hse.service';
import { AutorizacionService } from './services/autorizacion.service';
import { CodigoGeneratorService } from './services/codigo-generator.service';
import { AutorizacionValidator } from './validators/autorizacion.validator';
import { AutogestionService } from './services/autogestion.service';
import { TokenValidatorService } from './services/token-validator.service';
import { AccesoService } from './services/acceso.service';
import { CumplimientoService } from './services/cumplimiento.service';
import { ValidacionService } from './services/validacion.service';
import { ExcepcionService } from './services/excepcion.service';
import { ReportesService } from './services/reportes.service';
import { UploadSecurityService } from './services/upload-security.service';
import { ArchivadoService } from './services/archivado.service';
import { DepuracionCronService } from './services/depuracion-cron.service';

/**
 * HseModule — registra todas las entidades del módulo HSE en TypeORM.
 *
 * Equivalente a los imports de SQLAlchemy en `app/models/hse.py`.
 */
@Module({
  imports: [
    PersonaModule,
    NotificacionesModule,
    TypeOrmModule.forFeature([
      Sede,
      ConfigTiemposContratista,
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
      // Archivado
      HseSolicitudArchivado,
      // Auth entities necesarias para el cron
      Usuario,
      UsuarioRol,
      Rol,
    ]),
  ],
  controllers: [HseController],
  providers: [
    HseService,
    AutorizacionService,
    CodigoGeneratorService,
    AutorizacionValidator,
    AutogestionService,
    TokenValidatorService,
    AccesoService,
    CumplimientoService,
    ValidacionService,
    ExcepcionService,
    ReportesService,
    UploadSecurityService,
    ArchivadoService,
    DepuracionCronService,
  ],
  exports: [TypeOrmModule],
})
export class HseModule {}
