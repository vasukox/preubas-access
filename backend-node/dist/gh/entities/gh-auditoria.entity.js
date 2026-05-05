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
exports.GhAuditoria = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
let GhAuditoria = class GhAuditoria extends base_entity_1.BaseEntity {
    usuarioId;
    sedeId;
    accion;
    entidad;
    entidadId;
    detalle;
    usuario;
    sede;
};
exports.GhAuditoria = GhAuditoria;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhAuditoria.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhAuditoria.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: false }),
    __metadata("design:type", String)
], GhAuditoria.prototype, "accion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: false }),
    __metadata("design:type", String)
], GhAuditoria.prototype, "entidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entidad_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhAuditoria.prototype, "entidadId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], GhAuditoria.prototype, "detalle", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhAuditoria.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhAuditoria.prototype, "sede", void 0);
exports.GhAuditoria = GhAuditoria = __decorate([
    (0, typeorm_1.Entity)('gh_auditoria')
], GhAuditoria);
//# sourceMappingURL=gh-auditoria.entity.js.map