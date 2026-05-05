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
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseHistorial = class HseHistorial extends base_entity_1.BaseEntity {
    contratistaId;
    estadoAnterior;
    estadoNuevo;
    motivo;
    cambiadoPor;
    contratista;
    usuario;
};
exports.HseHistorial = HseHistorial;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseHistorial.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_anterior', type: 'enum', enum: hse_enum_1.EstadoContratista, nullable: true }),
    __metadata("design:type", String)
], HseHistorial.prototype, "estadoAnterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_nuevo', type: 'enum', enum: hse_enum_1.EstadoContratista, nullable: false }),
    __metadata("design:type", String)
], HseHistorial.prototype, "estadoNuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseHistorial.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cambiado_por', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseHistorial.prototype, "cambiadoPor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.historial, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseHistorial.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'cambiado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseHistorial.prototype, "usuario", void 0);
exports.HseHistorial = HseHistorial = __decorate([
    (0, typeorm_1.Entity)('hse_historial')
], HseHistorial);
//# sourceMappingURL=hse-historial.entity.js.map