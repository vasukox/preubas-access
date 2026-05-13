import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeToCamelMiddleware } from './common/middleware/snake-to-camel.middleware';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { SedeModule } from './sede/sede.module';
import { PersonaModule } from './persona/persona.module';
import { HseModule } from './hse/hse.module';
import { GhModule } from './gh/gh.module';
import { ConfigKoajModule } from './config-koaj/config-koaj.module';
import { HerramientasModule } from './herramientas/herramientas.module';
import { ParkingModule } from './parking/parking.module';
import { NfcModule } from './nfc/nfc.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { HerramientasController } from './herramientas/herramientas.controller';
import { ConfigKoajController } from './config-koaj/config-koaj.controller';
import { GhController } from './gh/gh.controller';
import { ProveedorController } from './persona/proveedor.controller';

/**
 * AppModule — módulo raíz de KOAJ Access NestJS.
 *
 * Equivalente a la configuración central de `app/main.py` en Python.
 * Todos los módulos funcionales se registran aquí.
 */
@Module({
  imports: [
    // ── Configuración global (env vars) ───────────────────────────
    ConfigModule,

    // ── Base de datos MySQL (TypeORM async) ───────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getDatabaseConfig(config),
    }),

    // ── Autenticación (JWT, usuarios, roles, permisos) ────────────
    AuthModule,

    // ── Entidades compartidas ─────────────────────────────────────
    SedeModule,
    PersonaModule,

    // ── Módulos funcionales ───────────────────────────────────────
    HseModule,            // Fase 4 — Health, Safety & Environment
    GhModule,             // Fase 5 — Gestión Humana
    ConfigKoajModule,     // Fase 2 — Configuración (sedes, catálogos)
    HerramientasModule,   // Fase 3 — Usuarios, roles, auditoría

    // ── Módulos futuros (placeholders) ───────────────────────────
    ParkingModule,        // Pendiente — Control parqueadero + LPR
    NfcModule,            // Pendiente — Activos NFC

    // ── WebSocket en tiempo real ──────────────────────────────────
    WebsocketsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply snake_case→camelCase conversion only to modules whose DTOs use camelCase.
    // HSE and Auth DTOs are already snake_case, so they are intentionally excluded.
    consumer
      .apply(SnakeToCamelMiddleware)
      .forRoutes(
        HerramientasController,
        ConfigKoajController,
        GhController,
        ProveedorController,
      );
  }
}