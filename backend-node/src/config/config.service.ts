import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * ConfigService tipado — equivalente a `app/config.py` (Settings de Pydantic).
 *
 * Centraliza todas las variables de entorno con validación en tiempo de arranque.
 * Si una variable crítica falta, la aplicación lanza error inmediatamente
 * en lugar de fallar en runtime.
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private readonly config: NestConfigService) {
    this.validateCriticalSettings();
  }

  // ── Aplicación ──────────────────────────────────────────────────

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.config.get<number>('PORT', 8000);
  }

  get appName(): string {
    return this.config.get<string>('APP_NAME', 'KOAJ Access API');
  }

  get appVersion(): string {
    return this.config.get<string>('APP_VERSION', '2.0.0');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // ── Base de datos ───────────────────────────────────────────────

  get databaseHost(): string {
    return this.config.getOrThrow<string>('DATABASE_HOST');
  }

  get databasePort(): number {
    return this.config.get<number>('DATABASE_PORT', 3306);
  }

  get databaseUser(): string {
    return this.config.getOrThrow<string>('DATABASE_USER');
  }

  get databasePassword(): string {
    return this.config.getOrThrow<string>('DATABASE_PASSWORD');
  }

  get databaseName(): string {
    return this.config.getOrThrow<string>('DATABASE_NAME');
  }

  // ── JWT ─────────────────────────────────────────────────────────

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get jwtAlgorithm(): string {
    return this.config.get<string>('JWT_ALGORITHM', 'HS256');
  }

  get jwtAccessExpireMinutes(): number {
    return this.config.get<number>('JWT_ACCESS_EXPIRE_MINUTES', 30);
  }

  get jwtRefreshExpireDays(): number {
    return this.config.get<number>('JWT_REFRESH_EXPIRE_DAYS', 7);
  }

  // ── CORS ────────────────────────────────────────────────────────

  get corsOrigins(): string[] {
    const raw = this.config.get<string>('CORS_ORIGINS', 'http://localhost:5173');
    return raw.split(',').map((origin) => origin.trim());
  }

  // ── Archivos ────────────────────────────────────────────────────

  get uploadDir(): string {
    return this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  get maxUploadSizeMb(): number {
    return this.config.get<number>('MAX_UPLOAD_SIZE_MB', 5);
  }

  get maxUploadSizeBytes(): number {
    return this.maxUploadSizeMb * 1024 * 1024;
  }

  // ── API Keys hardware ──────────────────────────────────────────

  get lprApiKey(): string {
    return this.config.get<string>('LPR_API_KEY', '');
  }

  get nfcReaderApiKey(): string {
    return this.config.get<string>('NFC_READER_API_KEY', '');
  }

  // ── Validación en arranque ──────────────────────────────────────

  private validateCriticalSettings(): void {
    if (this.isProduction) {
      this.validateProductionSettings();
    }
    this.logger.log(`Configuración cargada — entorno: ${this.nodeEnv}`);
  }

  private validateProductionSettings(): void {
    if (this.jwtSecret.includes('dev-secret-key')) {
      throw new Error(
        'JWT_SECRET debe ser cambiado antes de ir a producción. ' +
          'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }

    if (this.databasePassword === 'root') {
      throw new Error(
        'DATABASE_PASSWORD no puede usar credenciales de desarrollo en producción.',
      );
    }

    if (!this.lprApiKey) {
      throw new Error('LPR_API_KEY es requerido en producción.');
    }

    if (!this.nfcReaderApiKey) {
      throw new Error('NFC_READER_API_KEY es requerido en producción.');
    }
  }
}