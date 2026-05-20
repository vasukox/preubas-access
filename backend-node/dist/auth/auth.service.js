"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const usuario_entity_1 = require("./entities/usuario.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const config_service_1 = require("../config/config.service");
const rol_enum_1 = require("../common/enums/rol.enum");
const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;
let AuthService = AuthService_1 = class AuthService {
    usuarioRepo;
    refreshTokenRepo;
    auditLogRepo;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usuarioRepo, refreshTokenRepo, auditLogRepo, jwtService, configService) {
        this.usuarioRepo = usuarioRepo;
        this.refreshTokenRepo = refreshTokenRepo;
        this.auditLogRepo = auditLogRepo;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(dto, ipAddress, userAgent) {
        const usuario = await this.findUsuarioConRelaciones({
            email: dto.email.toLowerCase().trim(),
        });
        if (!usuario || !usuario.activo) {
            throw new common_1.UnauthorizedException({
                code: 'CREDENCIALES_INVALIDAS',
                message: 'Email o contraseña incorrectos.',
            });
        }
        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
            const minutosRestantes = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000);
            throw new common_1.UnauthorizedException({
                code: 'CUENTA_BLOQUEADA',
                message: `Cuenta bloqueada por ${minutosRestantes} minuto(s) por demasiados intentos fallidos.`,
            });
        }
        const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!passwordValida) {
            await this.registrarIntentoFallido(usuario);
            throw new common_1.UnauthorizedException({
                code: 'CREDENCIALES_INVALIDAS',
                message: 'Email o contraseña incorrectos.',
            });
        }
        await this.usuarioRepo.update(usuario.id, {
            intentosFallidos: 0,
            bloqueadoHasta: null,
            ultimoLogin: new Date(),
        });
        const roleObjs = usuario.roles.map((ur) => ({ id: ur.rolId, nombre: ur.rol?.nombre ?? 'UNKNOWN' }));
        const roleNames = roleObjs.map((r) => r.nombre);
        const tokens = await this.generarTokens(usuario, roleNames, ipAddress, userAgent);
        await this.registrarAudit(usuario.id, usuario.nombreCompleto, 'LOGIN', 'usuario', usuario.id);
        this.logger.log(`Login exitoso: ${usuario.email} desde ${ipAddress ?? 'IP desconocida'}`);
        const isAdmin = roleNames.includes(rol_enum_1.RolNombre.ADMIN_GLOBAL) || roleNames.includes(rol_enum_1.RolNombre.ADMIN_HSE) || roleNames.includes(rol_enum_1.RolNombre.ADMIN_GH);
        const sedesAsignadas = isAdmin
            ? []
            : (usuario.sedesAsignadas ?? [])
                .filter((us) => us.sede)
                .map((us) => ({ id: us.sede.id, nombre: us.sede.nombre, ciudad: us.sede.ciudad }));
        const sedesFallback = !isAdmin && sedesAsignadas.length === 0 && usuario.sedeAsignada
            ? [{ id: usuario.sedeAsignada.id, nombre: usuario.sedeAsignada.nombre, ciudad: usuario.sedeAsignada.ciudad }]
            : [];
        const sedesFinales = sedesAsignadas.length > 0 ? sedesAsignadas : sedesFallback;
        const sedePrincipal = sedesFinales[0] ?? null;
        return {
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'bearer',
                debeCambiarPassword: usuario.debeCambiarPassword,
            },
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombreCompleto: usuario.nombreCompleto,
                activo: usuario.activo,
                debeCambiarPassword: usuario.debeCambiarPassword,
                ultimoLogin: usuario.ultimoLogin ?? null,
                roles: roleObjs,
                sedeAsignadaId: isAdmin ? null : (usuario.sedeAsignadaId ?? sedePrincipal?.id ?? null),
                sedeAsignada: isAdmin ? null : (sedePrincipal
                    ? { id: sedePrincipal.id, nombre: sedePrincipal.nombre }
                    : null),
                sedesAsignadasIds: isAdmin ? [] : sedesFinales.map((s) => s.id),
                sedesAsignadas: isAdmin ? [] : sedesFinales,
            },
        };
    }
    async refreshTokens(rawRefreshToken, ipAddress, userAgent) {
        let payload;
        try {
            payload = this.jwtService.verify(rawRefreshToken, {
                secret: this.configService.jwtSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALIDO',
                message: 'El refresh token es inválido o ha expirado.',
            });
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALIDO',
                message: 'El token proporcionado no es un refresh token.',
            });
        }
        const tokenEntity = await this.refreshTokenRepo.findOne({
            where: { jti: payload.jti, revocado: false },
            relations: ['usuario', 'usuario.roles', 'usuario.roles.rol', 'usuario.perfil'],
        });
        if (!tokenEntity || tokenEntity.expiraEn < new Date()) {
            throw new common_1.UnauthorizedException({
                code: 'REFRESH_TOKEN_INVALIDO',
                message: 'El refresh token no es válido o ya fue utilizado.',
            });
        }
        const usuario = tokenEntity.usuario;
        if (!usuario.activo) {
            throw new common_1.UnauthorizedException({
                code: 'USUARIO_INACTIVO',
                message: 'Tu cuenta ha sido desactivada.',
            });
        }
        await this.refreshTokenRepo.update(tokenEntity.id, { revocado: true });
        const roles = usuario.roles.map((ur) => ur.rol.nombre);
        return this.generarTokens(usuario, roles, ipAddress, userAgent);
    }
    async logout(usuarioId) {
        await this.refreshTokenRepo
            .createQueryBuilder()
            .update()
            .set({ revocado: true })
            .where('usuario_id = :usuarioId AND revocado = false', { usuarioId })
            .execute();
        this.logger.log(`Logout completo: usuario_id=${usuarioId}`);
    }
    async findByIdWithRolesAndPermisos(id) {
        return this.findUsuarioConRelaciones({ id });
    }
    async changePassword(usuarioId, dto) {
        const usuario = await this.usuarioRepo.findOne({
            where: { id: usuarioId },
        });
        if (!usuario) {
            throw new common_1.UnauthorizedException({ code: 'USUARIO_NO_ENCONTRADO', message: 'Usuario no encontrado.' });
        }
        const esValida = await bcrypt.compare(dto.passwordActual, usuario.passwordHash);
        if (!esValida) {
            throw new common_1.BadRequestException({
                code: 'PASSWORD_INCORRECTO',
                message: 'La contraseña actual es incorrecta.',
            });
        }
        const esIgual = await bcrypt.compare(dto.passwordNueva, usuario.passwordHash);
        if (esIgual) {
            throw new common_1.BadRequestException({
                code: 'PASSWORD_IGUAL',
                message: 'La nueva contraseña no puede ser igual a la actual.',
            });
        }
        const nuevoHash = await bcrypt.hash(dto.passwordNueva, 12);
        await this.usuarioRepo.update(usuario.id, {
            passwordHash: nuevoHash,
            debeCambiarPassword: false,
        });
        await this.logout(usuarioId);
        await this.registrarAudit(usuario.id, usuario.nombreCompleto, 'CAMBIO_PASSWORD', 'usuario', usuario.id);
        this.logger.log(`Contraseña cambiada: usuario_id=${usuarioId}`);
    }
    async generarTokens(usuario, roles, ipAddress, userAgent) {
        const accessExpireSeconds = this.configService.jwtAccessExpireMinutes * 60;
        const refreshExpireDays = this.configService.jwtRefreshExpireDays;
        const accessPayload = {
            sub: usuario.id,
            email: usuario.email,
            roles,
            dcp: usuario.debeCambiarPassword,
        };
        const jti = (0, uuid_1.v4)();
        const accessToken = this.jwtService.sign(accessPayload, {
            expiresIn: accessExpireSeconds,
        });
        const refreshToken = this.jwtService.sign({ sub: usuario.id, jti, type: 'refresh' }, { expiresIn: `${refreshExpireDays}d` });
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + refreshExpireDays);
        await this.refreshTokenRepo.save(this.refreshTokenRepo.create({
            usuarioId: usuario.id,
            jti,
            revocado: false,
            expiraEn,
            userAgent: userAgent ?? undefined,
            ipAddress: ipAddress ?? undefined,
        }));
        return {
            accessToken,
            refreshToken,
            tokenType: 'bearer',
            expiresIn: accessExpireSeconds,
        };
    }
    async findUsuarioConRelaciones(where) {
        const relacionesBase = ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada'];
        const relacionesConSedes = [...relacionesBase, 'sedesAsignadas', 'sedesAsignadas.sede'];
        try {
            return await this.usuarioRepo.findOne({
                where,
                relations: relacionesConSedes,
            });
        }
        catch (error) {
            this.logger.warn(`No se pudo cargar usuario_sedes; usando sede_asignada_id como respaldo. ${error.message}`);
            return this.usuarioRepo.findOne({
                where,
                relations: relacionesBase,
            });
        }
    }
    async registrarIntentoFallido(usuario) {
        const nuevosIntentos = (usuario.intentosFallidos ?? 0) + 1;
        const update = { intentosFallidos: nuevosIntentos };
        if (nuevosIntentos >= MAX_INTENTOS_FALLIDOS) {
            const bloqueadoHasta = new Date();
            bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + MINUTOS_BLOQUEO);
            update.bloqueadoHasta = bloqueadoHasta;
            this.logger.warn(`Cuenta bloqueada: ${usuario.email} (${nuevosIntentos} intentos fallidos)`);
        }
        await this.usuarioRepo.update(usuario.id, update);
    }
    async registrarAudit(actorId, actorNombre, accion, entidad, entidadId, descripcion) {
        await this.auditLogRepo.save(this.auditLogRepo.create({
            actorId,
            actorNombre,
            accion,
            entidad,
            entidadId,
            descripcion: descripcion ?? undefined,
        }));
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(2, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_service_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map