import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { ConfigService } from './config/config.service';

/**
 * AppController — endpoints raíz del sistema.
 *
 * Equivalente al lifespan y endpoints base de `app/main.py` en Python.
 *
 * Rutas:
 *   GET /api/v1/          → info básica de la API (público)
 *   GET /api/v1/health    → health check + info de entorno (público)
 */
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /api/v1/
   * Información básica de la API. Usado para confirmar que el servidor responde.
   */
  @Public()
  @Get()
  getInfo() {
    return {
      name: this.configService.appName,
      version: this.configService.appVersion,
      environment: this.configService.nodeEnv,
      docs: '/api/v1/health',
    };
  }

  /**
   * GET /api/v1/health
   * Health check del servidor. Consumido por el frontend SessionProvider
   * y por herramientas de monitoreo (uptime robots, load balancers).
   *
   * Equivalente a `GET /health` en Python (app/main.py).
   */
  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: this.configService.nodeEnv,
      version: this.configService.appVersion,
    };
  }
}
