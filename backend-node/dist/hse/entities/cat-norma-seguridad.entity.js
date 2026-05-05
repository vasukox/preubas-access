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
exports.CatNormaSeguridad = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
let CatNormaSeguridad = class CatNormaSeguridad extends base_entity_1.BaseEntity {
    numero;
    titulo;
    contenido;
    activa;
    sedeId;
    sede;
};
exports.CatNormaSeguridad = CatNormaSeguridad;
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false, comment: 'Orden de lectura' }),
    __metadata("design:type", Number)
], CatNormaSeguridad.prototype, "numero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: false }),
    __metadata("design:type", String)
], CatNormaSeguridad.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], CatNormaSeguridad.prototype, "contenido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], CatNormaSeguridad.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: true, comment: 'NULL = aplica a todas las sedes' }),
    __metadata("design:type", Number)
], CatNormaSeguridad.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], CatNormaSeguridad.prototype, "sede", void 0);
exports.CatNormaSeguridad = CatNormaSeguridad = __decorate([
    (0, typeorm_1.Entity)('cat_normas_seguridad')
], CatNormaSeguridad);
//# sourceMappingURL=cat-norma-seguridad.entity.js.map