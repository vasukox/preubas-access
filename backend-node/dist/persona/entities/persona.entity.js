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
exports.Persona = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const proveedor_entity_1 = require("./proveedor.entity");
let Persona = class Persona extends base_entity_1.BaseEntity {
    tipoDocumento;
    numeroDocumento;
    nombres;
    apellidos;
    email;
    telefonoCelular;
    ciudadOperacion;
    direccionDomicilio;
    esExtranjero;
    fechaNacimiento;
    tratamientoDatos;
    proveedorId;
    tipologiaHse;
    activo;
    notas;
    proveedor;
};
exports.Persona = Persona;
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_documento', type: 'enum', enum: ['CC', 'CE', 'PASAPORTE', 'TI', 'NIT'], nullable: false }),
    __metadata("design:type", String)
], Persona.prototype, "tipoDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'numero_documento', type: 'varchar', length: 30, nullable: false }),
    __metadata("design:type", String)
], Persona.prototype, "numeroDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Persona.prototype, "nombres", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Persona.prototype, "apellidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_celular', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "telefonoCelular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ciudad_operacion', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "ciudadOperacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_domicilio', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "direccionDomicilio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_extranjero', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], Persona.prototype, "esExtranjero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_nacimiento', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Persona.prototype, "fechaNacimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tratamiento_datos', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], Persona.prototype, "tratamientoDatos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proveedor_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Persona.prototype, "proveedorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipologia_hse', type: 'enum', enum: ['CONTRATISTA_EMPRESA', 'TECNICO_INDEPENDIENTE', 'PROVEEDOR_SERVICIOS', 'INSPECTOR_AUDITOR', 'FUNCIONARIO_PUBLICO'], nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "tipologiaHse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Persona.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Persona.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proveedor_entity_1.Proveedor, (prov) => prov.personas, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'proveedor_id' }),
    __metadata("design:type", proveedor_entity_1.Proveedor)
], Persona.prototype, "proveedor", void 0);
exports.Persona = Persona = __decorate([
    (0, typeorm_1.Entity)('personas')
], Persona);
//# sourceMappingURL=persona.entity.js.map