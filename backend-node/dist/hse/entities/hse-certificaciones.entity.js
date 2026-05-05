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
exports.HseCertificaciones = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
let HseCertificaciones = class HseCertificaciones extends base_entity_1.BaseEntity {
    contratistaId;
    urlCertificadoAlturas;
    fechaVencimientoAlturas;
    urlCertificadoConfinados;
    fechaVencimientoConfinados;
    urlLicenciaSst;
    urlOtrosCertificados;
    contratista;
};
exports.HseCertificaciones = HseCertificaciones;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseCertificaciones.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_certificado_alturas', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "urlCertificadoAlturas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_vencimiento_alturas', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseCertificaciones.prototype, "fechaVencimientoAlturas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_certificado_confinados', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "urlCertificadoConfinados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_vencimiento_confinados', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseCertificaciones.prototype, "fechaVencimientoConfinados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_licencia_sst', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "urlLicenciaSst", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_otros_certificados', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "urlOtrosCertificados", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.certificaciones, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseCertificaciones.prototype, "contratista", void 0);
exports.HseCertificaciones = HseCertificaciones = __decorate([
    (0, typeorm_1.Entity)('hse_certificaciones')
], HseCertificaciones);
//# sourceMappingURL=hse-certificaciones.entity.js.map