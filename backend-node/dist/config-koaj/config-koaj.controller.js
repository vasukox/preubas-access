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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigKoajController = void 0;
const common_1 = require("@nestjs/common");
const config_koaj_service_1 = require("./config-koaj.service");
const config_koaj_dto_1 = require("./dto/config-koaj.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let ConfigKoajController = class ConfigKoajController {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getSistema() {
        return {
            access_token_expire_minutes: 60,
            refresh_token_expire_days: 7,
            max_upload_size_mb: 10,
            allowed_origins: ['*'],
            debug: process.env.NODE_ENV !== 'production',
            environment: process.env.NODE_ENV || 'development'
        };
    }
    listarSedes() {
        return this.configService.listarSedes();
    }
    getSede(id) {
        return this.configService.getSede(id);
    }
    crearSede(dto) {
        return this.configService.crearSede(dto);
    }
    actualizarSede(id, dto) {
        return this.configService.actualizarSede(id, dto);
    }
    listarUbicaciones(sedeId) {
        return this.configService.listarUbicaciones(sedeId);
    }
    crearUbicacion(dto) {
        return this.configService.crearUbicacion(dto);
    }
    actualizarUbicacion(id, dto) {
        return this.configService.actualizarUbicacion(id, dto);
    }
    eliminarUbicacion(id) {
        return this.configService.eliminarUbicacion(id);
    }
    listarCatalogo(tipo) {
        return this.configService.listarCatalogo(tipo);
    }
    crearItemCatalogo(tipo, dto) {
        return this.configService.crearItemCatalogo(tipo, dto);
    }
    actualizarItemCatalogo(tipo, id, dto) {
        return this.configService.actualizarItemCatalogo(tipo, id, dto);
    }
    eliminarItemCatalogo(tipo, id) {
        return this.configService.eliminarItemCatalogo(tipo, id);
    }
    listarNormas(sedeId) {
        const id = sedeId ? parseInt(sedeId, 10) : undefined;
        return this.configService.listarNormas(id);
    }
    crearNorma(dto) {
        return this.configService.crearNorma(dto);
    }
    actualizarNorma(id, dto) {
        return this.configService.actualizarNorma(id, dto);
    }
    eliminarNorma(id) {
        return this.configService.eliminarNorma(id);
    }
};
exports.ConfigKoajController = ConfigKoajController;
__decorate([
    (0, common_1.Get)('sistema'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "getSistema", null);
__decorate([
    (0, common_1.Get)('sedes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "listarSedes", null);
__decorate([
    (0, common_1.Get)('sedes/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "getSede", null);
__decorate([
    (0, common_1.Post)('sedes'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_koaj_dto_1.CreateSedeDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "crearSede", null);
__decorate([
    (0, common_1.Put)('sedes/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, config_koaj_dto_1.UpdateSedeDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "actualizarSede", null);
__decorate([
    (0, common_1.Get)('sedes/:id/ubicaciones'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "listarUbicaciones", null);
__decorate([
    (0, common_1.Post)('ubicaciones'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_koaj_dto_1.CreateUbicacionDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "crearUbicacion", null);
__decorate([
    (0, common_1.Put)('ubicaciones/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, config_koaj_dto_1.UpdateUbicacionDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "actualizarUbicacion", null);
__decorate([
    (0, common_1.Delete)('ubicaciones/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "eliminarUbicacion", null);
__decorate([
    (0, common_1.Get)('catalogos/:tipo'),
    __param(0, (0, common_1.Param)('tipo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "listarCatalogo", null);
__decorate([
    (0, common_1.Post)('catalogos/:tipo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, config_koaj_dto_1.CreateCatalogoDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "crearItemCatalogo", null);
__decorate([
    (0, common_1.Put)('catalogos/:tipo/:id'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, config_koaj_dto_1.UpdateCatalogoDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "actualizarItemCatalogo", null);
__decorate([
    (0, common_1.Delete)('catalogos/:tipo/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "eliminarItemCatalogo", null);
__decorate([
    (0, common_1.Get)('normas'),
    __param(0, (0, common_1.Query)('sede_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "listarNormas", null);
__decorate([
    (0, common_1.Post)('normas'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_koaj_dto_1.CreateNormaDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "crearNorma", null);
__decorate([
    (0, common_1.Put)('normas/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, config_koaj_dto_1.UpdateNormaDto]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "actualizarNorma", null);
__decorate([
    (0, common_1.Delete)('normas/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ConfigKoajController.prototype, "eliminarNorma", null);
exports.ConfigKoajController = ConfigKoajController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GLOBAL),
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [config_koaj_service_1.ConfigKoajService])
], ConfigKoajController);
//# sourceMappingURL=config-koaj.controller.js.map