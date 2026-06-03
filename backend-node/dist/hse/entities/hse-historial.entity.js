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
exports.HseHistorial = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
let HseHistorial = class HseHistorial extends base_entity_1.BaseEntity {
    contratistaId;
    usuarioId;
    estadoAnterior;
    estadoNuevo;
    motivo;
    metadataExtra;
    contratista;
    usuario;
};
exports.HseHistorial = HseHistorial;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseHistorial.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], HseHistorial.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado_anterior',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], HseHistorial.prototype, "estadoAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado_nuevo',
        type: 'varchar',
        length: 50,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseHistorial.prototype, "estadoNuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], HseHistorial.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata_extra', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], HseHistorial.prototype, "metadataExtra", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.historial, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseHistorial.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseHistorial.prototype, "usuario", void 0);
exports.HseHistorial = HseHistorial = __decorate([
    (0, typeorm_1.Entity)('hse_historial_estados')
], HseHistorial);
//# sourceMappingURL=hse-historial.entity.js.map