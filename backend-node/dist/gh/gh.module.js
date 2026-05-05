"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const gh_candidato_entity_1 = require("./entities/gh-candidato.entity");
const gh_cita_entity_1 = require("./entities/gh-cita.entity");
const gh_portal_token_entity_1 = require("./entities/gh-portal-token.entity");
const gh_acceso_vigilancia_entity_1 = require("./entities/gh-acceso-vigilancia.entity");
const gh_importacion_entity_1 = require("./entities/gh-importacion.entity");
const gh_importacion_detalle_entity_1 = require("./entities/gh-importacion-detalle.entity");
const gh_auditoria_entity_1 = require("./entities/gh-auditoria.entity");
const gh_sesion_induccion_entity_1 = require("./entities/gh-sesion-induccion.entity");
const gh_induccion_asistencia_entity_1 = require("./entities/gh-induccion-asistencia.entity");
const gh_maestro_dotacion_entity_1 = require("./entities/gh-maestro-dotacion.entity");
const gh_dotacion_entrega_entity_1 = require("./entities/gh-dotacion-entrega.entity");
const gh_dotacion_entrega_detalle_entity_1 = require("./entities/gh-dotacion-entrega-detalle.entity");
const gh_controller_1 = require("./gh.controller");
const gh_service_1 = require("./gh.service");
let GhModule = class GhModule {
};
exports.GhModule = GhModule;
exports.GhModule = GhModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                gh_candidato_entity_1.GhCandidato,
                gh_cita_entity_1.GhCita,
                gh_portal_token_entity_1.GhPortalToken,
                gh_acceso_vigilancia_entity_1.GhAccesoVigilancia,
                gh_importacion_entity_1.GhImportacion,
                gh_importacion_detalle_entity_1.GhImportacionDetalle,
                gh_auditoria_entity_1.GhAuditoria,
                gh_sesion_induccion_entity_1.GhSesionInduccion,
                gh_induccion_asistencia_entity_1.GhInduccionAsistencia,
                gh_maestro_dotacion_entity_1.GhMaestroDotacion,
                gh_dotacion_entrega_entity_1.GhDotacionEntrega,
                gh_dotacion_entrega_detalle_entity_1.GhDotacionEntregaDetalle,
            ]),
        ],
        controllers: [gh_controller_1.GhController],
        providers: [gh_service_1.GhService],
        exports: [typeorm_1.TypeOrmModule],
    })
], GhModule);
//# sourceMappingURL=gh.module.js.map