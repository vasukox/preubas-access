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
exports.GhDotacionEntrega = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_candidato_entity_1 = require("./gh-candidato.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const gh_dotacion_entrega_detalle_entity_1 = require("./gh-dotacion-entrega-detalle.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhDotacionEntrega = class GhDotacionEntrega extends base_entity_1.BaseEntity {
    candidatoId;
    sesionOCitaId;
    tipoReferencia;
    estadoEntrega;
    entregadoPorUsuarioId;
    fechaEntrega;
    observaciones;
    candidato;
    entregador;
    detalles;
};
exports.GhDotacionEntrega = GhDotacionEntrega;
__decorate([
    (0, typeorm_1.Column)({ name: 'candidato_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhDotacionEntrega.prototype, "candidatoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sesion_o_cita_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhDotacionEntrega.prototype, "sesionOCitaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_referencia', type: 'varchar', length: 20, nullable: false, comment: 'SESION o CITA' }),
    __metadata("design:type", String)
], GhDotacionEntrega.prototype, "tipoReferencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_entrega', type: 'enum', enum: gh_enum_1.GhDotacionEntregaEstado, default: gh_enum_1.GhDotacionEntregaEstado.PENDIENTE, nullable: false }),
    __metadata("design:type", String)
], GhDotacionEntrega.prototype, "estadoEntrega", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entregado_por_usuario_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhDotacionEntrega.prototype, "entregadoPorUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_entrega', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GhDotacionEntrega.prototype, "fechaEntrega", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhDotacionEntrega.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_candidato_entity_1.GhCandidato, (candidato) => candidato.dotacionEntregas, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'candidato_id' }),
    __metadata("design:type", gh_candidato_entity_1.GhCandidato)
], GhDotacionEntrega.prototype, "candidato", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'entregado_por_usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhDotacionEntrega.prototype, "entregador", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_dotacion_entrega_detalle_entity_1.GhDotacionEntregaDetalle, (detalle) => detalle.entrega, { cascade: true }),
    __metadata("design:type", Array)
], GhDotacionEntrega.prototype, "detalles", void 0);
exports.GhDotacionEntrega = GhDotacionEntrega = __decorate([
    (0, typeorm_1.Entity)('gh_dotacion_entregas')
], GhDotacionEntrega);
//# sourceMappingURL=gh-dotacion-entrega.entity.js.map