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
exports.HerramientasController = void 0;
const common_1 = require("@nestjs/common");
const herramientas_service_1 = require("./herramientas.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
const create_usuario_dto_1 = require("./dto/create-usuario.dto");
const update_usuario_dto_1 = require("./dto/update-usuario.dto");
const update_permisos_dto_1 = require("./dto/update-permisos.dto");
const asignar_rol_dto_1 = require("./dto/asignar-rol.dto");
let HerramientasController = class HerramientasController {
    herramientasService;
    constructor(herramientasService) {
        this.herramientasService = herramientasService;
    }
    async listarRoles() {
        return this.herramientasService.listarRoles();
    }
    async listarUsuarios() {
        return this.herramientasService.listarUsuarios();
    }
    async crearUsuario(dto, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        const usuarioCreado = await this.herramientasService.crearUsuario(dto, req.user.id, currentUserName);
        return usuarioCreado;
    }
    async actualizarUsuario(id, dto, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        return this.herramientasService.actualizarUsuario(id, dto, req.user.id, currentUserName);
    }
    async eliminarUsuario(id, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        await this.herramientasService.eliminarUsuario(id, req.user.id, currentUserName);
        return { message: 'Usuario eliminado correctamente' };
    }
    async listarAuditoria(limite) {
        return this.herramientasService.listarAuditoria(limite);
    }
    async actualizarPermisos(id, dto, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        return this.herramientasService.actualizarPermisos(id, dto, req.user.id, currentUserName);
    }
    async asignarRol(id, dto, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        return this.herramientasService.asignarRol(id, dto.rolNombre, req.user.id, currentUserName);
    }
    async quitarRol(id, rolNombre, req) {
        const currentUserName = req.user.nombreCompleto || req.user.email;
        return this.herramientasService.quitarRol(id, rolNombre, req.user.id, currentUserName);
    }
};
exports.HerramientasController = HerramientasController;
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "listarRoles", null);
__decorate([
    (0, common_1.Get)('usuarios'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "listarUsuarios", null);
__decorate([
    (0, common_1.Post)('usuarios'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_usuario_dto_1.CreateUsuarioDto, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "crearUsuario", null);
__decorate([
    (0, common_1.Put)('usuarios/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_usuario_dto_1.UpdateUsuarioDto, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "actualizarUsuario", null);
__decorate([
    (0, common_1.Delete)('usuarios/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "eliminarUsuario", null);
__decorate([
    (0, common_1.Get)('auditoria'),
    __param(0, (0, common_1.Query)('limite', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "listarAuditoria", null);
__decorate([
    (0, common_1.Put)('usuarios/:id/permisos'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_permisos_dto_1.UpdatePermisosDto, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "actualizarPermisos", null);
__decorate([
    (0, common_1.Post)('usuarios/:id/roles'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asignar_rol_dto_1.AsignarRolDto, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "asignarRol", null);
__decorate([
    (0, common_1.Delete)('usuarios/:id/roles/:rolNombre'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('rolNombre')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], HerramientasController.prototype, "quitarRol", null);
exports.HerramientasController = HerramientasController = __decorate([
    (0, common_1.Controller)('herramientas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __metadata("design:paramtypes", [herramientas_service_1.HerramientasService])
], HerramientasController);
//# sourceMappingURL=herramientas.controller.js.map