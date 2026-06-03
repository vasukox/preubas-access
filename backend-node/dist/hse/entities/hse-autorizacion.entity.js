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
exports.HseAutorizacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const proveedor_entity_1 = require("../../persona/entities/proveedor.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseAutorizacion = class HseAutorizacion extends base_entity_1.BaseEntity {
    codigo;
    proveedorId;
    sedeId;
    creadoPor;
    responsableInternoId;
    tipoContratista;
    descripcionActividad;
    fechaInicio;
    fechaFin;
    estado;
    motivoDenegacion;
    proveedor;
    sede;
    creador;
    responsableInterno;
    contratistas;
};
exports.HseAutorizacion = HseAutorizacion;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        unique: true,
        nullable: false,
        comment: 'HSE-2026-XXXX — generado automáticamente',
    }),
    __metadata("design:type", String)
], HseAutorizacion.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proveedor_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], HseAutorizacion.prototype, "proveedorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseAutorizacion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'creado_por', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseAutorizacion.prototype, "creadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsable_interno_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseAutorizacion.prototype, "responsableInternoId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tipo_contratista',
        type: 'enum',
        enum: hse_enum_1.TipoContratista,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseAutorizacion.prototype, "tipoContratista", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion_actividad', type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseAutorizacion.prototype, "descripcionActividad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseAutorizacion.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseAutorizacion.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: hse_enum_1.EstadoAutorizacion,
        default: hse_enum_1.EstadoAutorizacion.BORRADOR,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseAutorizacion.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_denegacion', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], HseAutorizacion.prototype, "motivoDenegacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proveedor_entity_1.Proveedor, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'proveedor_id' }),
    __metadata("design:type", proveedor_entity_1.Proveedor)
], HseAutorizacion.prototype, "proveedor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], HseAutorizacion.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseAutorizacion.prototype, "creador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'responsable_interno_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HseAutorizacion.prototype, "responsableInterno", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.autorizacion, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], HseAutorizacion.prototype, "contratistas", void 0);
exports.HseAutorizacion = HseAutorizacion = __decorate([
    (0, typeorm_1.Entity)('hse_autorizaciones')
], HseAutorizacion);
//# sourceMappingURL=hse-autorizacion.entity.js.map