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
exports.Proveedor = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const persona_entity_1 = require("./persona.entity");
let Proveedor = class Proveedor extends base_entity_1.BaseEntity {
    nomProveedor;
    nitProveedor;
    tipoIdentificacionProv;
    estadoProv;
    direccionProv;
    telefonoProv;
    emailContacto;
    ciudad;
    tratamientoDatos;
    notas;
    personas;
};
exports.Proveedor = Proveedor;
__decorate([
    (0, typeorm_1.Column)({ name: 'nom_proveedor', type: 'varchar', length: 200, nullable: false }),
    __metadata("design:type", String)
], Proveedor.prototype, "nomProveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nit_proveedor', type: 'varchar', length: 20, unique: true, nullable: false }),
    __metadata("design:type", String)
], Proveedor.prototype, "nitProveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_identificacion_prov', type: 'enum', enum: ['NIT', 'CC', 'CE', 'PASAPORTE'], nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "tipoIdentificacionProv", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_prov', type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Proveedor.prototype, "estadoProv", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_prov', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "direccionProv", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_prov', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "telefonoProv", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_contacto', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "emailContacto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "ciudad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tratamiento_datos', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], Proveedor.prototype, "tratamientoDatos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Proveedor.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => persona_entity_1.Persona, (persona) => persona.proveedor),
    __metadata("design:type", Array)
], Proveedor.prototype, "personas", void 0);
exports.Proveedor = Proveedor = __decorate([
    (0, typeorm_1.Entity)('proveedores')
], Proveedor);
//# sourceMappingURL=proveedor.entity.js.map