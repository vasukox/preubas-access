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
exports.HseClasificacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseClasificacion = class HseClasificacion extends base_entity_1.BaseEntity {
    contratistaId;
    riesgo;
    modalidadTrabajo;
    cargoActividad;
    requiereTrabajoAltura;
    requiereEspaciosConfinados;
    requiereEnergiasPeligrosas;
    requiereCaliente;
    requiereQuimicos;
    contratista;
};
exports.HseClasificacion = HseClasificacion;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseClasificacion.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: hse_enum_1.RiesgoClasificacion, nullable: false }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "riesgo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modalidad_trabajo', type: 'enum', enum: hse_enum_1.ModalidadTrabajo, nullable: false }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "modalidadTrabajo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cargo_actividad', type: 'varchar', length: 250, nullable: false }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "cargoActividad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_trabajo_altura', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "requiereTrabajoAltura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_espacios_confinados', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "requiereEspaciosConfinados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_energias_peligrosas', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "requiereEnergiasPeligrosas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_caliente', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "requiereCaliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_quimicos', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "requiereQuimicos", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.clasificacion, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseClasificacion.prototype, "contratista", void 0);
exports.HseClasificacion = HseClasificacion = __decorate([
    (0, typeorm_1.Entity)('hse_clasificacion')
], HseClasificacion);
//# sourceMappingURL=hse-clasificacion.entity.js.map