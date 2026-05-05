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
exports.HseController = void 0;
const common_1 = require("@nestjs/common");
const hse_service_1 = require("./hse.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let HseController = class HseController {
    hseService;
    constructor(hseService) {
        this.hseService = hseService;
    }
    async getSedes(req) {
        return this.hseService.getCatalogosSedes(req.user);
    }
    async getEps() {
        return this.hseService.getCatalogosEps();
    }
    async getProveedores() {
        return [];
    }
    async getAutorizaciones(sedeId, estado, page, perPage) {
        try {
            const p = page ? parseInt(page, 10) : 1;
            const pp = perPage ? parseInt(perPage, 10) : 20;
            const result = await this.hseService.getAutorizaciones(sedeId, estado, p, pp);
            return result.items;
        }
        catch (e) {
            throw new (require('@nestjs/common')).HttpException({ error: e.message, stack: e.stack }, 500);
        }
    }
    async getDashboard(sedeId) {
        return this.hseService.getDashboard(sedeId);
    }
};
exports.HseController = HseController;
__decorate([
    (0, common_1.Get)('catalogos/sedes'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getSedes", null);
__decorate([
    (0, common_1.Get)('catalogos/eps'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getEps", null);
__decorate([
    (0, common_1.Get)('catalogos/proveedores'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getProveedores", null);
__decorate([
    (0, common_1.Get)('autorizaciones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAutorizaciones", null);
__decorate([
    (0, common_1.Get)('dashboard/:sedeId'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sedeId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getDashboard", null);
exports.HseController = HseController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('hse'),
    __metadata("design:paramtypes", [hse_service_1.HseService])
], HseController);
//# sourceMappingURL=hse.controller.js.map