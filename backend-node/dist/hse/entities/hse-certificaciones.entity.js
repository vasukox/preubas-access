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
exports.HseCertificaciones = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseCertificaciones = class HseCertificaciones extends base_entity_1.BaseEntity {
    contratistaId;
    artDescripcionTarea;
    artArchivo;
    permisoTipo;
    permisoFecha;
    permisoArchivo;
    contratista;
};
exports.HseCertificaciones = HseCertificaciones;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseCertificaciones.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'art_descripcion_tarea', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "artDescripcionTarea", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'art_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "artArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'permiso_tipo',
        type: 'enum',
        enum: hse_enum_1.PermisoTipo,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "permisoTipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permiso_fecha', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseCertificaciones.prototype, "permisoFecha", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'permiso_archivo',
        type: 'varchar',
        length: 500,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseCertificaciones.prototype, "permisoArchivo", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.certificaciones, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseCertificaciones.prototype, "contratista", void 0);
exports.HseCertificaciones = HseCertificaciones = __decorate([
    (0, typeorm_1.Entity)('hse_certificaciones')
], HseCertificaciones);
//# sourceMappingURL=hse-certificaciones.entity.js.map