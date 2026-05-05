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
exports.Sede = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const ubicacion_entity_1 = require("./ubicacion.entity");
let Sede = class Sede extends base_entity_1.BaseEntity {
    nombre;
    codigo;
    ciudad;
    direccion;
    telefono;
    activa;
    capacidadCarros;
    capacidadMotos;
    capacidadBicis;
    aplicaPicoPlaca;
    notas;
    ubicaciones;
};
exports.Sede = Sede;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true, nullable: false }),
    __metadata("design:type", String)
], Sede.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, nullable: false }),
    __metadata("design:type", String)
], Sede.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, default: 'Bogotá', nullable: false }),
    __metadata("design:type", String)
], Sede.prototype, "ciudad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Sede.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Sede.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Sede.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'capacidad_carros',
        type: 'int',
        default: 0,
        nullable: false,
    }),
    __metadata("design:type", Number)
], Sede.prototype, "capacidadCarros", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'capacidad_motos',
        type: 'int',
        default: 0,
        nullable: false,
    }),
    __metadata("design:type", Number)
], Sede.prototype, "capacidadMotos", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'capacidad_bicis',
        type: 'int',
        default: 0,
        nullable: false,
    }),
    __metadata("design:type", Number)
], Sede.prototype, "capacidadBicis", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'aplica_pico_placa',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], Sede.prototype, "aplicaPicoPlaca", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Sede.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ubicacion_entity_1.Ubicacion, (ubicacion) => ubicacion.sede, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Sede.prototype, "ubicaciones", void 0);
exports.Sede = Sede = __decorate([
    (0, typeorm_1.Entity)('sedes')
], Sede);
//# sourceMappingURL=sede.entity.js.map