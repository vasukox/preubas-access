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
exports.HseExamenMedico = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
let HseExamenMedico = class HseExamenMedico extends base_entity_1.BaseEntity {
    contratistaId;
    urlCertificadoAptitud;
    fechaEmision;
    aptoConRestricciones;
    restricciones;
    contratista;
};
exports.HseExamenMedico = HseExamenMedico;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseExamenMedico.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_certificado_aptitud', type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseExamenMedico.prototype, "urlCertificadoAptitud", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_emision', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseExamenMedico.prototype, "fechaEmision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apto_con_restricciones', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseExamenMedico.prototype, "aptoConRestricciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseExamenMedico.prototype, "restricciones", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.examenMedico, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseExamenMedico.prototype, "contratista", void 0);
exports.HseExamenMedico = HseExamenMedico = __decorate([
    (0, typeorm_1.Entity)('hse_examen_medico')
], HseExamenMedico);
//# sourceMappingURL=hse-examen-medico.entity.js.map