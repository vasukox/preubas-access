import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
export declare function getDatabaseConfig(config: ConfigService): TypeOrmModuleOptions;
