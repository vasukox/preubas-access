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
exports.HseAceptacionNormas = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
let HseAceptacionNormas = class HseAceptacionNormas extends base_entity_1.BaseEntity {
    contratistaId;
    aceptoNormas;
    aceptoDatos;
    firmaDigital;
    fechaAceptacion;
    ipAddress;
    contratista;
};
exports.HseAceptacionNormas = HseAceptacionNormas;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseAceptacionNormas.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acepto_normas', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseAceptacionNormas.prototype, "aceptoNormas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acepto_datos', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseAceptacionNormas.prototype, "aceptoDatos", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'firma_digital',
        type: 'varchar',
        length: 200,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseAceptacionNormas.prototype, "firmaDigital", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_aceptacion', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], HseAceptacionNormas.prototype, "fechaAceptacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], HseAceptacionNormas.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.aceptacionNormas, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseAceptacionNormas.prototype, "contratista", void 0);
exports.HseAceptacionNormas = HseAceptacionNormas = __decorate([
    (0, typeorm_1.Entity)('hse_aceptacion_normas')
], HseAceptacionNormas);
//# sourceMappingURL=hse-aceptacion-normas.entity.js.map