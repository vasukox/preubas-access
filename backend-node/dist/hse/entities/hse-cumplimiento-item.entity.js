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
exports.HseCumplimientoItem = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_cumplimiento_entity_1 = require("./hse-cumplimiento.entity");
let HseCumplimientoItem = class HseCumplimientoItem extends base_entity_1.BaseEntity {
    cumplimientoId;
    requisitoCodigo;
    esCumplido;
    observacion;
    cumplimiento;
};
exports.HseCumplimientoItem = HseCumplimientoItem;
__decorate([
    (0, typeorm_1.Column)({ name: 'cumplimiento_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseCumplimientoItem.prototype, "cumplimientoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requisito_codigo', type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], HseCumplimientoItem.prototype, "requisitoCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_cumplido', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], HseCumplimientoItem.prototype, "esCumplido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCumplimientoItem.prototype, "observacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_cumplimiento_entity_1.HseCumplimiento, (cumplimiento) => cumplimiento.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cumplimiento_id' }),
    __metadata("design:type", hse_cumplimiento_entity_1.HseCumplimiento)
], HseCumplimientoItem.prototype, "cumplimiento", void 0);
exports.HseCumplimientoItem = HseCumplimientoItem = __decorate([
    (0, typeorm_1.Entity)('hse_cumplimientos_items')
], HseCumplimientoItem);
//# sourceMappingURL=hse-cumplimiento-item.entity.js.map