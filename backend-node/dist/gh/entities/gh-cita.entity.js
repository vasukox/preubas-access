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
exports.GhCita = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_candidato_entity_1 = require("./gh-candidato.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const gh_portal_token_entity_1 = require("./gh-portal-token.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhCita = class GhCita extends base_entity_1.BaseEntity {
    codigo;
    candidatoId;
    sedeId;
    responsableId;
    tipoCita;
    estado;
    fechaHoraInicio;
    fechaHoraFin;
    observaciones;
    candidato;
    sede;
    responsable;
    tokensPortal;
};
exports.GhCita = GhCita;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 25, nullable: false, unique: true }),
    __metadata("design:type", String)
], GhCita.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'candidato_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhCita.prototype, "candidatoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhCita.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsable_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhCita.prototype, "responsableId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_cita', type: 'enum', enum: gh_enum_1.GhTipoCita, nullable: false }),
    __metadata("design:type", String)
], GhCita.prototype, "tipoCita", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: gh_enum_1.GhEstadoCita, default: gh_enum_1.GhEstadoCita.PROGRAMADA, nullable: false }),
    __metadata("design:type", String)
], GhCita.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_hora_inicio', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], GhCita.prototype, "fechaHoraInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_hora_fin', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], GhCita.prototype, "fechaHoraFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhCita.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_candidato_entity_1.GhCandidato, (candidato) => candidato.citas, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'candidato_id' }),
    __metadata("design:type", gh_candidato_entity_1.GhCandidato)
], GhCita.prototype, "candidato", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhCita.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'responsable_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhCita.prototype, "responsable", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_portal_token_entity_1.GhPortalToken, (token) => token.cita),
    __metadata("design:type", Array)
], GhCita.prototype, "tokensPortal", void 0);
exports.GhCita = GhCita = __decorate([
    (0, typeorm_1.Entity)('gh_citas')
], GhCita);
//# sourceMappingURL=gh-cita.entity.js.map