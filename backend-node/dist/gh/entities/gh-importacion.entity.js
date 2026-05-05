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
exports.GhImportacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const gh_importacion_detalle_entity_1 = require("./gh-importacion-detalle.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhImportacion = class GhImportacion extends base_entity_1.BaseEntity {
    sedeId;
    creadoPor;
    nombreArchivo;
    estado;
    filasTotales;
    filasExitosas;
    filasFallidas;
    resumenError;
    sede;
    creador;
    detalles;
};
exports.GhImportacion = GhImportacion;
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhImportacion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'creado_por', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhImportacion.prototype, "creadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_archivo', type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], GhImportacion.prototype, "nombreArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: gh_enum_1.GhImportacionEstado, default: gh_enum_1.GhImportacionEstado.PENDIENTE, nullable: false }),
    __metadata("design:type", String)
], GhImportacion.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filas_totales', type: 'int', default: 0, nullable: false }),
    __metadata("design:type", Number)
], GhImportacion.prototype, "filasTotales", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filas_exitosas', type: 'int', default: 0, nullable: false }),
    __metadata("design:type", Number)
], GhImportacion.prototype, "filasExitosas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'filas_fallidas', type: 'int', default: 0, nullable: false }),
    __metadata("design:type", Number)
], GhImportacion.prototype, "filasFallidas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resumen_error', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhImportacion.prototype, "resumenError", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhImportacion.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'creado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhImportacion.prototype, "creador", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_importacion_detalle_entity_1.GhImportacionDetalle, (detalle) => detalle.importacion, { cascade: true }),
    __metadata("design:type", Array)
], GhImportacion.prototype, "detalles", void 0);
exports.GhImportacion = GhImportacion = __decorate([
    (0, typeorm_1.Entity)('gh_importaciones')
], GhImportacion);
//# sourceMappingURL=gh-importacion.entity.js.map