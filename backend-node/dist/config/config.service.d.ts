import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private readonly config;
    private readonly logger;
    constructor(config: NestConfigService);
    get nodeEnv(): string;
    get port(): number;
    get appName(): string;
    get appVersion(): string;
    get isProduction(): boolean;
    get isDevelopment(): boolean;
    get databaseHost(): string;
    get databasePort(): number;
    get databaseUser(): string;
    get databasePassword(): string;
    get databaseName(): string;
    get jwtSecret(): string;
    get jwtAlgorithm(): string;
    get jwtAccessExpireMinutes(): number;
    get jwtRefreshExpireDays(): number;
    get corsOrigins(): string[];
    get uploadDir(): string;
    get maxUploadSizeMb(): number;
    get maxUploadSizeBytes(): number;
    get lprApiKey(): string;
    get nfcReaderApiKey(): string;
    private validateCriticalSettings;
    private validateProductionSettings;
}
