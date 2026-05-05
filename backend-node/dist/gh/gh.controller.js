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
exports.GhController = void 0;
const common_1 = require("@nestjs/common");
const gh_service_1 = require("./gh.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let GhController = class GhController {
    ghService;
    constructor(ghService) {
        this.ghService = ghService;
    }
    async getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, page, perPage) {
        const p = page ? parseInt(page, 10) : 1;
        const pp = perPage ? parseInt(perPage, 10) : 20;
        return this.ghService.getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, p, pp);
    }
};
exports.GhController = GhController;
__decorate([
    (0, common_1.Get)('citas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('tipo_cita')),
    __param(3, (0, common_1.Query)('busqueda')),
    __param(4, (0, common_1.Query)('fecha_desde')),
    __param(5, (0, common_1.Query)('fecha_hasta')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getCitas", null);
exports.GhController = GhController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('gh'),
    __metadata("design:paramtypes", [gh_service_1.GhService])
], GhController);
//# sourceMappingURL=gh.controller.js.map