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
exports.HseCumplimiento = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const hse_cumplimiento_item_entity_1 = require("./hse-cumplimiento-item.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseCumplimiento = class HseCumplimiento extends base_entity_1.BaseEntity {
    contratistaId;
    evaluadorId;
    estado;
    porcentajeCumplimiento;
    fechaEvaluacion;
    observacionesGenerales;
    contratista;
    evaluador;
    items;
};
exports.HseCumplimiento = HseCumplimiento;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseCumplimiento.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evaluador_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseCumplimiento.prototype, "evaluadorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: hse_enum_1.CumplimientoEstado, default: hse_enum_1.CumplimientoEstado.EN_PROGRESO, nullable: false }),
    __metadata("design:type", String)
], HseCumplimiento.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'porcentaje_cumplimiento', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], HseCumplimiento.prototype, "porcentajeCumplimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_evaluacion', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], HseCumplimiento.prototype, "fechaEvaluacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'observaciones_generales', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCumplimiento.prototype, "observacionesGenerales", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.cumplimientos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseCumplimiento.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'evaluador_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseCumplimiento.prototype, "evaluador", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_cumplimiento_item_entity_1.HseCumplimientoItem, (item) => item.cumplimiento, { cascade: true }),
    __metadata("design:type", Array)
], HseCumplimiento.prototype, "items", void 0);
exports.HseCumplimiento = HseCumplimiento = __decorate([
    (0, typeorm_1.Entity)('hse_cumplimientos')
], HseCumplimiento);
//# sourceMappingURL=hse-cumplimiento.entity.js.map