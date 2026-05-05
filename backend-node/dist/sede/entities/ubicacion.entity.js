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
exports.Ubicacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("./sede.entity");
let Ubicacion = class Ubicacion extends base_entity_1.BaseEntity {
    sedeId;
    nombre;
    codigo;
    tipo;
    activa;
    descripcion;
    sede;
};
exports.Ubicacion = Ubicacion;
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Ubicacion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Ubicacion.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Ubicacion.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'GENERAL', nullable: false }),
    __metadata("design:type", String)
], Ubicacion.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Ubicacion.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Ubicacion.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, (sede) => sede.ubicaciones, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], Ubicacion.prototype, "sede", void 0);
exports.Ubicacion = Ubicacion = __decorate([
    (0, typeorm_1.Entity)('ubicaciones')
], Ubicacion);
//# sourceMappingURL=ubicacion.entity.js.map