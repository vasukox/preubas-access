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
exports.GhAccesoVigilancia = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_cita_entity_1 = require("./gh-cita.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhAccesoVigilancia = class GhAccesoVigilancia extends base_entity_1.BaseEntity {
    citaId;
    sedeId;
    vigilanteId;
    tipoAcceso;
    metodo;
    notas;
    cita;
    sede;
    vigilante;
};
exports.GhAccesoVigilancia = GhAccesoVigilancia;
__decorate([
    (0, typeorm_1.Column)({ name: 'cita_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhAccesoVigilancia.prototype, "citaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhAccesoVigilancia.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vigilante_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhAccesoVigilancia.prototype, "vigilanteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_acceso', type: 'enum', enum: gh_enum_1.GhTipoAcceso, nullable: false }),
    __metadata("design:type", String)
], GhAccesoVigilancia.prototype, "tipoAcceso", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false, default: 'MANUAL' }),
    __metadata("design:type", String)
], GhAccesoVigilancia.prototype, "metodo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhAccesoVigilancia.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_cita_entity_1.GhCita, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'cita_id' }),
    __metadata("design:type", gh_cita_entity_1.GhCita)
], GhAccesoVigilancia.prototype, "cita", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhAccesoVigilancia.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'vigilante_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhAccesoVigilancia.prototype, "vigilante", void 0);
exports.GhAccesoVigilancia = GhAccesoVigilancia = __decorate([
    (0, typeorm_1.Entity)('gh_accesos_vigilancia')
], GhAccesoVigilancia);
//# sourceMappingURL=gh-acceso-vigilancia.entity.js.map