"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const config_service_1 = require("../config/config.service");
const usuario_entity_1 = require("./entities/usuario.entity");
const usuario_rol_entity_1 = require("./entities/usuario-rol.entity");
const rol_entity_1 = require("./entities/rol.entity");
const usuario_permiso_entity_1 = require("./entities/usuario-permiso.entity");
const perfil_entity_1 = require("./entities/perfil.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const sede_entity_1 = require("../sede/entities/sede.entity");
const usuario_sede_entity_1 = require("./entities/usuario-sede.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                usuario_entity_1.Usuario,
                usuario_rol_entity_1.UsuarioRol,
                rol_entity_1.Rol,
                usuario_permiso_entity_1.UsuarioPermiso,
                perfil_entity_1.Perfil,
                refresh_token_entity_1.RefreshToken,
                audit_log_entity_1.AuditLog,
                sede_entity_1.Sede,
                usuario_sede_entity_1.UsuarioSede,
            ]),
            jwt_1.JwtModule.registerAsync({
                useFactory: (config) => ({
                    secret: config.jwtSecret,
                    signOptions: {
                        algorithm: config.jwtAlgorithm,
                        expiresIn: config.jwtAccessExpireMinutes * 60,
                    },
                }),
                inject: [config_service_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map