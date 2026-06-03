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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, req) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];
        return this.authService.login(dto, ipAddress, userAgent);
    }
    async refresh(dto, req) {
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];
        return this.authService.refreshTokens(dto.refresh_token, ipAddress, userAgent);
    }
    async logout(req) {
        await this.authService.logout(req.user.id);
        return { message: 'Sesión cerrada correctamente.' };
    }
    async getMe(req) {
        const usuario = await this.authService.findByIdWithRolesAndPermisos(req.user.id);
        if (!usuario) {
            throw new common_1.UnauthorizedException({
                code: 'USUARIO_NO_ENCONTRADO',
                message: 'El usuario no existe o fue eliminado.',
            });
        }
        const result = {
            id: usuario.id,
            email: usuario.email,
            nombreCompleto: usuario.nombreCompleto,
            activo: usuario.activo,
            debeCambiarPassword: usuario.debeCambiarPassword,
            ultimoLogin: usuario.ultimoLogin ?? null,
            roles: usuario.roles.map((ur) => ({
                id: ur.rolId,
                nombre: ur.rol?.nombre ?? 'UNKNOWN',
            })),
        };
        const roleNames = result.roles.map((r) => r.nombre);
        const isAdmin = roleNames.includes(rol_enum_1.RolNombre.ADMIN_GLOBAL) ||
            roleNames.includes(rol_enum_1.RolNombre.ADMIN_HSE) ||
            roleNames.includes(rol_enum_1.RolNombre.ADMIN_GH);
        const sedesAsignadas = isAdmin
            ? []
            : (usuario.sedesAsignadas ?? [])
                .filter((us) => us.sede)
                .map((us) => ({
                id: us.sede.id,
                nombre: us.sede.nombre,
                ciudad: us.sede.ciudad,
            }));
        const sedesFallback = !isAdmin && sedesAsignadas.length === 0 && usuario.sedeAsignada
            ? [
                {
                    id: usuario.sedeAsignada.id,
                    nombre: usuario.sedeAsignada.nombre,
                    ciudad: usuario.sedeAsignada.ciudad,
                },
            ]
            : [];
        const sedesFinales = sedesAsignadas.length > 0 ? sedesAsignadas : sedesFallback;
        const sedePrincipal = sedesFinales[0] ?? null;
        return {
            ...result,
            sedeAsignadaId: isAdmin
                ? null
                : (usuario.sedeAsignadaId ?? sedePrincipal?.id ?? null),
            sedeAsignada: isAdmin
                ? null
                : sedePrincipal
                    ? { id: sedePrincipal.id, nombre: sedePrincipal.nombre }
                    : null,
            sedesAsignadasIds: isAdmin ? [] : sedesFinales.map((s) => s.id),
            sedesAsignadas: isAdmin ? [] : sedesFinales,
            perfil: usuario.perfil
                ? {
                    fotoPerfil: usuario.perfil.fotoPerfil ?? null,
                    biografia: usuario.perfil.biografia ?? null,
                    telefono: usuario.perfil.telefono ?? null,
                    tema: usuario.perfil.tema,
                    notificacionesEmail: usuario.perfil.notificacionesEmail,
                }
                : null,
            permisos: usuario.permisos
                ? {
                    puedeVer: usuario.permisos.puedeVer,
                    puedeCrear: usuario.permisos.puedeCrear,
                    puedeEditar: usuario.permisos.puedeEditar,
                    puedeEliminar: usuario.permisos.puedeEliminar,
                }
                : null,
        };
    }
    async changePassword(dto, req) {
        await this.authService.changePassword(req.user.id, dto);
        return {
            message: 'Contraseña actualizada correctamente. Vuelve a iniciar sesión.',
        };
    }
    getClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.socket?.remoteAddress ?? 'unknown';
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map