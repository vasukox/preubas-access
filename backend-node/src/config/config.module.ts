import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

/**
 * Módulo de configuración global.
 *
 * Carga el archivo .env y expone el ConfigService tipado
 * a toda la aplicación sin necesidad de imports explícitos.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
