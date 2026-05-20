"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HerramientasModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const usuario_entity_1 = require("../auth/entities/usuario.entity");
const rol_entity_1 = require("../auth/entities/rol.entity");
const usuario_rol_entity_1 = require("../auth/entities/usuario-rol.entity");
const usuario_permiso_entity_1 = require("../auth/entities/usuario-permiso.entity");
const perfil_entity_1 = require("../auth/entities/perfil.entity");
const audit_log_entity_1 = require("../auth/entities/audit-log.entity");
const usuario_sede_entity_1 = require("../auth/entities/usuario-sede.entity");
const sede_entity_1 = require("../sede/entities/sede.entity");
const herramientas_controller_1 = require("./herramientas.controller");
const herramientas_service_1 = require("./herramientas.service");
let HerramientasModule = class HerramientasModule {
};
exports.HerramientasModule = HerramientasModule;
exports.HerramientasModule = HerramientasModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                usuario_entity_1.Usuario,
                rol_entity_1.Rol,
                usuario_rol_entity_1.UsuarioRol,
                usuario_permiso_entity_1.UsuarioPermiso,
                perfil_entity_1.Perfil,
                audit_log_entity_1.AuditLog,
                usuario_sede_entity_1.UsuarioSede,
                sede_entity_1.Sede,
            ]),
        ],
        controllers: [herramientas_controller_1.HerramientasController],
        providers: [herramientas_service_1.HerramientasService],
    })
], HerramientasModule);
//# sourceMappingURL=herramientas.module.js.map