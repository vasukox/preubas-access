import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Entities propias de este módulo (catálogos y normas) ─────────────────────
import { CatEps } from '../hse/entities/cat-eps.entity';
import { CatArl } from '../hse/entities/cat-arl.entity';
import { CatAfp } from '../hse/entities/cat-afp.entity';
import { CatNormaSeguridad } from '../hse/entities/cat-norma-seguridad.entity';
import { Sede } from '../sede/entities/sede.entity';
import { Ubicacion } from '../sede/entities/ubicacion.entity';
import { ConfigTiemposContratista } from './entities/config-tiempos-contratista.entity';

// ── Capa de negocio y presentación ───────────────────────────────────────────
import { ConfigKoajController } from './config-koaj.controller';
import { ConfigKoajService } from './config-koaj.service';

/**
 * ConfigKoajModule — Fase 2 de la migración.
 *
 * Gestiona toda la configuración global del sistema KOAJ Access:
 *   - Sedes (instalaciones físicas de Permoda S.A.S.)
 *   - Ubicaciones (zonas dentro de cada sede)
 *   - Catálogos: EPS, ARL, AFP (usados en autogestión HSE)
 *   - Normas de seguridad (aceptadas en el wizard de autogestión)
 *
 * Acceso: exclusivo ADMIN_GLOBAL.
 *
 * Exporta ConfigKoajService para que otros módulos (HseModule, GhModule)
 * puedan consumir la lógica de sedes y normas sin duplicar código.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sede,
      Ubicacion,
      CatEps,
      CatArl,
      CatAfp,
      CatNormaSeguridad,
      ConfigTiemposContratista,
    ]),
  ],
  controllers: [ConfigKoajController],
  providers: [ConfigKoajService],
  exports: [ConfigKoajService],  // ← disponible para HseModule y GhModule
})
export class ConfigKoajModule {}
