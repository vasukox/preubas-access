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
exports.GhDotacionEntregaDetalle = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_dotacion_entrega_entity_1 = require("./gh-dotacion-entrega.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhDotacionEntregaDetalle = class GhDotacionEntregaDetalle extends base_entity_1.BaseEntity {
    entregaId;
    itemCodigo;
    itemNombre;
    cantidadEsperada;
    cantidadEntregada;
    estadoItem;
    evidenciaUrl;
    entrega;
};
exports.GhDotacionEntregaDetalle = GhDotacionEntregaDetalle;
__decorate([
    (0, typeorm_1.Column)({ name: 'entrega_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhDotacionEntregaDetalle.prototype, "entregaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_codigo', type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], GhDotacionEntregaDetalle.prototype, "itemCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_nombre', type: 'varchar', length: 200, nullable: false }),
    __metadata("design:type", String)
], GhDotacionEntregaDetalle.prototype, "itemNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cantidad_esperada', type: 'int', default: 1, nullable: false }),
    __metadata("design:type", Number)
], GhDotacionEntregaDetalle.prototype, "cantidadEsperada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cantidad_entregada', type: 'int', default: 0, nullable: false }),
    __metadata("design:type", Number)
], GhDotacionEntregaDetalle.prototype, "cantidadEntregada", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_item', type: 'enum', enum: gh_enum_1.GhDotacionItemEstado, default: gh_enum_1.GhDotacionItemEstado.PENDIENTE, nullable: false }),
    __metadata("design:type", String)
], GhDotacionEntregaDetalle.prototype, "estadoItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evidencia_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhDotacionEntregaDetalle.prototype, "evidenciaUrl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_dotacion_entrega_entity_1.GhDotacionEntrega, (entrega) => entrega.detalles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'entrega_id' }),
    __metadata("design:type", gh_dotacion_entrega_entity_1.GhDotacionEntrega)
], GhDotacionEntregaDetalle.prototype, "entrega", void 0);
exports.GhDotacionEntregaDetalle = GhDotacionEntregaDetalle = __decorate([
    (0, typeorm_1.Entity)('gh_dotacion_entregas_detalle')
], GhDotacionEntregaDetalle);
//# sourceMappingURL=gh-dotacion-entrega-detalle.entity.js.map