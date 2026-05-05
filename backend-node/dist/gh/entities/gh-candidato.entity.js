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
exports.GhCandidato = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_cita_entity_1 = require("./gh-cita.entity");
const gh_induccion_asistencia_entity_1 = require("./gh-induccion-asistencia.entity");
const gh_dotacion_entrega_entity_1 = require("./gh-dotacion-entrega.entity");
let GhCandidato = class GhCandidato extends base_entity_1.BaseEntity {
    tipoDocumento;
    numeroDocumento;
    nombres;
    apellidos;
    email;
    telefono;
    citas;
    asistenciasInduccion;
    dotacionEntregas;
};
exports.GhCandidato = GhCandidato;
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_documento', type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], GhCandidato.prototype, "tipoDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_documento', type: 'varchar', length: 30, nullable: false, unique: true }),
    __metadata("design:type", String)
], GhCandidato.prototype, "numeroDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhCandidato.prototype, "nombres", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhCandidato.prototype, "apellidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], GhCandidato.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], GhCandidato.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_cita_entity_1.GhCita, (cita) => cita.candidato),
    __metadata("design:type", Array)
], GhCandidato.prototype, "citas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_induccion_asistencia_entity_1.GhInduccionAsistencia, (asistencia) => asistencia.candidato),
    __metadata("design:type", Array)
], GhCandidato.prototype, "asistenciasInduccion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_dotacion_entrega_entity_1.GhDotacionEntrega, (entrega) => entrega.candidato),
    __metadata("design:type", Array)
], GhCandidato.prototype, "dotacionEntregas", void 0);
exports.GhCandidato = GhCandidato = __decorate([
    (0, typeorm_1.Entity)('gh_candidatos')
], GhCandidato);
//# sourceMappingURL=gh-candidato.entity.js.map