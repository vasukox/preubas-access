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
exports.HseExcepcion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const persona_entity_1 = require("../../persona/entities/persona.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
let HseExcepcion = class HseExcepcion extends base_entity_1.BaseEntity {
    personaId;
    tipoDocumento;
    numeroDocumento;
    nombreCompleto;
    proveedorId;
    origenExcepcion;
    ubicacionId;
    aprobadoPor;
    sedeId;
    motivo;
    fechaInicio;
    fechaFin;
    activa;
    persona;
    aprobador;
    sede;
};
exports.HseExcepcion = HseExcepcion;
__decorate([
    (0, typeorm_1.Column)({ name: 'persona_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "personaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_documento', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "tipoDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_documento', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "numeroDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_completo', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "nombreCompleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proveedor_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "proveedorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'origen_excepcion', type: 'varchar', length: 20, default: 'INDIVIDUAL' }),
    __metadata("design:type", String)
], HseExcepcion.prototype, "origenExcepcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ubicacion_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "ubicacionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aprobado_por', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseExcepcion.prototype, "aprobadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseExcepcion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo', type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseExcepcion.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseExcepcion.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseExcepcion.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activa', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], HseExcepcion.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.Persona, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'persona_id' }),
    __metadata("design:type", Object)
], HseExcepcion.prototype, "persona", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'aprobado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseExcepcion.prototype, "aprobador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], HseExcepcion.prototype, "sede", void 0);
exports.HseExcepcion = HseExcepcion = __decorate([
    (0, typeorm_1.Entity)('hse_excepciones')
], HseExcepcion);
//# sourceMappingURL=hse-excepcion.entity.js.map