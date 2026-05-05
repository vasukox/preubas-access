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
exports.GhMaestroDotacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
let GhMaestroDotacion = class GhMaestroDotacion extends base_entity_1.BaseEntity {
    sedeId;
    area;
    cargo;
    tipoContrato;
    kitCodigo;
    kitDescripcion;
    activo;
    sede;
};
exports.GhMaestroDotacion = GhMaestroDotacion;
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhMaestroDotacion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhMaestroDotacion.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhMaestroDotacion.prototype, "cargo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_contrato', type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], GhMaestroDotacion.prototype, "tipoContrato", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kit_codigo', type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], GhMaestroDotacion.prototype, "kitCodigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kit_descripcion', type: 'text', nullable: false }),
    __metadata("design:type", String)
], GhMaestroDotacion.prototype, "kitDescripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], GhMaestroDotacion.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhMaestroDotacion.prototype, "sede", void 0);
exports.GhMaestroDotacion = GhMaestroDotacion = __decorate([
    (0, typeorm_1.Entity)('gh_maestro_dotacion')
], GhMaestroDotacion);
//# sourceMappingURL=gh-maestro-dotacion.entity.js.map