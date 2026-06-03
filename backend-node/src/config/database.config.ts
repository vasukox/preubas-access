import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from './config.service';

/**
 * Configuración de TypeORM para MySQL.
 *
 * Equivalente a `app/database.py` de SQLAlchemy:
 *   - Pool: 10 conexiones base + 20 overflow
 *   - charset: utf8mb4
 *   - timezone: UTC
 *   - synchronize: false (nunca modificar esquema en producción)
 */
export function getDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    charset: 'utf8mb4',
    timezone: 'Z',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: config.isDevelopment, // TEMPORAL: crea tablas nuevas; deshabilitar antes de producción
    logging: config.isDevelopment ? ['error', 'warn', 'query'] : ['error'],
    maxQueryExecutionTime: 3000,
    extra: {
      connectionLimit: 10,
      queueLimit: 20,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    },
    retryAttempts: 3,
    retryDelay: 3000,
  };
}
