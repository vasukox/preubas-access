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
exports.HseAcceso = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
let HseAcceso = class HseAcceso extends base_entity_1.BaseEntity {
    contratistaId;
    sedeId;
    registradoPor;
    tipoAcceso;
    fechaHora;
    puerta;
    observaciones;
    contratista;
    sede;
    usuarioRegistro;
};
exports.HseAcceso = HseAcceso;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseAcceso.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseAcceso.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registrado_por', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseAcceso.prototype, "registradoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_acceso', type: 'varchar', length: 20, nullable: false, comment: 'ENTRADA / SALIDA' }),
    __metadata("design:type", String)
], HseAcceso.prototype, "tipoAcceso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_hora', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], HseAcceso.prototype, "fechaHora", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], HseAcceso.prototype, "puerta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseAcceso.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.accesos, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseAcceso.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], HseAcceso.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'registrado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseAcceso.prototype, "usuarioRegistro", void 0);
exports.HseAcceso = HseAcceso = __decorate([
    (0, typeorm_1.Entity)('hse_accesos')
], HseAcceso);
//# sourceMappingURL=hse-acceso.entity.js.map