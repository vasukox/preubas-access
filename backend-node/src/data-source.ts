import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

/**
 * DataSource para el CLI de TypeORM (generación y ejecución de migraciones).
 * Uso:
 *   npm run migration:generate -- src/database/migrations/NombreMigracion
 *   npm run migration:run
 *   npm run migration:revert
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
  username: process.env.DATABASE_USER ?? 'root',
  password: process.env.DATABASE_PASSWORD ?? '',
  database: process.env.DATABASE_NAME ?? 'koaj_access',
  charset: 'utf8mb4',
  timezone: 'Z',
  synchronize: false,
  entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'database/migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
});
