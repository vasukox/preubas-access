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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhInduccionAsistencia = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_sesion_induccion_entity_1 = require("./gh-sesion-induccion.entity");
const gh_candidato_entity_1 = require("./gh-candidato.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhInduccionAsistencia = class GhInduccionAsistencia extends base_entity_1.BaseEntity {
    sesionId;
    candidatoId;
    tokenAutogestion;
    estadoAsistencia;
    checkinAt;
    checkoutAt;
    intentosCodigo;
    ultimoErrorCodigo;
    ipEntrada;
    userAgentEntrada;
    ipSalida;
    userAgentSalida;
    sesion;
    candidato;
};
exports.GhInduccionAsistencia = GhInduccionAsistencia;
__decorate([
    (0, typeorm_1.Column)({ name: 'sesion_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhInduccionAsistencia.prototype, "sesionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'candidato_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhInduccionAsistencia.prototype, "candidatoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_autogestion', type: 'varchar', length: 96, nullable: false, unique: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "tokenAutogestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_asistencia', type: 'enum', enum: gh_enum_1.GhEstadoAsistenciaInduccion, default: gh_enum_1.GhEstadoAsistenciaInduccion.PENDIENTE, nullable: false }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "estadoAsistencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checkin_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GhInduccionAsistencia.prototype, "checkinAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checkout_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GhInduccionAsistencia.prototype, "checkoutAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'intentos_codigo', type: 'int', default: 0, nullable: false }),
    __metadata("design:type", Number)
], GhInduccionAsistencia.prototype, "intentosCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_error_codigo', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "ultimoErrorCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_entrada', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "ipEntrada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent_entrada', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "userAgentEntrada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_salida', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "ipSalida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent_salida', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhInduccionAsistencia.prototype, "userAgentSalida", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_sesion_induccion_entity_1.GhSesionInduccion, (sesion) => sesion.asistentes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sesion_id' }),
    __metadata("design:type", gh_sesion_induccion_entity_1.GhSesionInduccion)
], GhInduccionAsistencia.prototype, "sesion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_candidato_entity_1.GhCandidato, (candidato) => candidato.asistenciasInduccion, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'candidato_id' }),
    __metadata("design:type", gh_candidato_entity_1.GhCandidato)
], GhInduccionAsistencia.prototype, "candidato", void 0);
exports.GhInduccionAsistencia = GhInduccionAsistencia = __decorate([
    (0, typeorm_1.Entity)('gh_induccion_asistencias')
], GhInduccionAsistencia);
//# sourceMappingURL=gh-induccion-asistencia.entity.js.map