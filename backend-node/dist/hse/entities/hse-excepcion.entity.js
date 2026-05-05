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
exports.HseExcepcion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
let HseExcepcion = class HseExcepcion extends base_entity_1.BaseEntity {
    contratistaId;
    autorizadorId;
    sedeId;
    motivoExcepcion;
    fechaValidezInicio;
    fechaValidezFin;
    esActiva;
    contratista;
    autorizador;
    sede;
};
exports.HseExcepcion = HseExcepcion;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseExcepcion.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'autorizador_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseExcepcion.prototype, "autorizadorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseExcepcion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_excepcion', type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseExcepcion.prototype, "motivoExcepcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_validez_inicio', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], HseExcepcion.prototype, "fechaValidezInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_validez_fin', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], HseExcepcion.prototype, "fechaValidezFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_activa', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], HseExcepcion.prototype, "esActiva", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseExcepcion.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'autorizador_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseExcepcion.prototype, "autorizador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], HseExcepcion.prototype, "sede", void 0);
exports.HseExcepcion = HseExcepcion = __decorate([
    (0, typeorm_1.Entity)('hse_excepciones')
], HseExcepcion);
//# sourceMappingURL=hse-excepcion.entity.js.map