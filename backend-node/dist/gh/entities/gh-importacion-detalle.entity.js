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
exports.GhImportacionDetalle = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_importacion_entity_1 = require("./gh-importacion.entity");
let GhImportacionDetalle = class GhImportacionDetalle extends base_entity_1.BaseEntity {
    importacionId;
    numeroFila;
    estado;
    mensaje;
    payload;
    importacion;
};
exports.GhImportacionDetalle = GhImportacionDetalle;
__decorate([
    (0, typeorm_1.Column)({ name: 'importacion_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhImportacionDetalle.prototype, "importacionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_fila', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhImportacionDetalle.prototype, "numeroFila", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'ERROR', nullable: false }),
    __metadata("design:type", String)
], GhImportacionDetalle.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], GhImportacionDetalle.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], GhImportacionDetalle.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_importacion_entity_1.GhImportacion, (importacion) => importacion.detalles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'importacion_id' }),
    __metadata("design:type", gh_importacion_entity_1.GhImportacion)
], GhImportacionDetalle.prototype, "importacion", void 0);
exports.GhImportacionDetalle = GhImportacionDetalle = __decorate([
    (0, typeorm_1.Entity)('gh_importaciones_detalle')
], GhImportacionDetalle);
//# sourceMappingURL=gh-importacion-detalle.entity.js.map