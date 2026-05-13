"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = ConfigService_1 = class ConfigService {
    config;
    logger = new common_1.Logger(ConfigService_1.name);
    constructor(config) {
        this.config = config;
        this.validateCriticalSettings();
    }
    get nodeEnv() {
        return this.config.get('NODE_ENV', 'development');
    }
    get port() {
        return this.config.get('PORT', 8000);
    }
    get appName() {
        return this.config.get('APP_NAME', 'KOAJ Access API');
    }
    get appVersion() {
        return this.config.get('APP_VERSION', '2.0.0');
    }
    get isProduction() {
        return this.nodeEnv === 'production';
    }
    get isDevelopment() {
        return this.nodeEnv === 'development';
    }
    get databaseHost() {
        return this.config.getOrThrow('DATABASE_HOST');
    }
    get databasePort() {
        return this.config.get('DATABASE_PORT', 3306);
    }
    get databaseUser() {
        return this.config.getOrThrow('DATABASE_USER');
    }
    get databasePassword() {
        return this.config.getOrThrow('DATABASE_PASSWORD');
    }
    get databaseName() {
        return this.config.getOrThrow('DATABASE_NAME');
    }
    get jwtSecret() {
        return this.config.getOrThrow('JWT_SECRET');
    }
    get jwtAlgorithm() {
        return this.config.get('JWT_ALGORITHM', 'HS256');
    }
    get jwtAccessExpireMinutes() {
        return this.config.get('JWT_ACCESS_EXPIRE_MINUTES', 30);
    }
    get jwtRefreshExpireDays() {
        return this.config.get('JWT_REFRESH_EXPIRE_DAYS', 7);
    }
    get corsOrigins() {
        const raw = this.config.get('CORS_ORIGINS', 'http://localhost:5173');
        return raw.split(',').map((origin) => origin.trim());
    }
    get uploadDir() {
        return this.config.get('UPLOAD_DIR', './uploads');
    }
    get maxUploadSizeMb() {
        return this.config.get('MAX_UPLOAD_SIZE_MB', 5);
    }
    get maxUploadSizeBytes() {
        return this.maxUploadSizeMb * 1024 * 1024;
    }
    get lprApiKey() {
        return this.config.get('LPR_API_KEY', '');
    }
    get nfcReaderApiKey() {
        return this.config.get('NFC_READER_API_KEY', '');
    }
    validateCriticalSettings() {
        if (this.isProduction) {
            this.validateProductionSettings();
        }
        this.logger.log(`Configuración cargada — entorno: ${this.nodeEnv}`);
    }
    validateProductionSettings() {
        if (this.jwtSecret.includes('dev-secret-key')) {
            throw new Error('JWT_SECRET debe ser cambiado antes de ir a producción. ' +
                'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        }
        if (this.jwtSecret.length < 32) {
            throw new Error('JWT_SECRET debe tener al menos 32 caracteres en produccion.');
        }
        if (this.databasePassword === 'root') {
            throw new Error('DATABASE_PASSWORD no puede usar credenciales de desarrollo en producción.');
        }
        if (!this.lprApiKey) {
            throw new Error('LPR_API_KEY es requerido en producción.');
        }
        if (!this.nfcReaderApiKey) {
            throw new Error('NFC_READER_API_KEY es requerido en producción.');
        }
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = ConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map