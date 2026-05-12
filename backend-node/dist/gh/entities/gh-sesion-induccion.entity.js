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
exports.GhSesionInduccion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_entity_1 = require("../../auth/entities/usuario.entity");
const gh_induccion_asistencia_entity_1 = require("./gh-induccion-asistencia.entity");
const gh_enum_1 = require("../../common/enums/gh.enum");
let GhSesionInduccion = class GhSesionInduccion extends base_entity_1.BaseEntity {
    sedeId;
    area;
    tipoInduccion;
    tipoSesion;
    linkVirtual;
    salaFisica;
    descripcion;
    capacidadMaxima;
    responsableUsuarioId;
    fechaHoraInicio;
    fechaHoraFin;
    estadoSesion;
    codigoCheckinActual;
    codigoCheckoutActual;
    fechaCierre;
    sede;
    responsable;
    asistentes;
};
exports.GhSesionInduccion = GhSesionInduccion;
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhSesionInduccion.prototype, "sedeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_induccion', type: 'varchar', length: 120, nullable: false }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "tipoInduccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_sesion', type: 'enum', enum: gh_enum_1.GhTipoSesion, default: gh_enum_1.GhTipoSesion.PRESENCIAL, nullable: false }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "tipoSesion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'link_virtual', type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "linkVirtual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sala_fisica', type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "salaFisica", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'capacidad_maxima', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhSesionInduccion.prototype, "capacidadMaxima", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsable_usuario_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], GhSesionInduccion.prototype, "responsableUsuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_hora_inicio', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], GhSesionInduccion.prototype, "fechaHoraInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_hora_fin', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], GhSesionInduccion.prototype, "fechaHoraFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_sesion', type: 'enum', enum: gh_enum_1.GhEstadoSesionInduccion, default: gh_enum_1.GhEstadoSesionInduccion.PROGRAMADA, nullable: false }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "estadoSesion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'codigo_checkin_actual', type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "codigoCheckinActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'codigo_checkout_actual', type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], GhSesionInduccion.prototype, "codigoCheckoutActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_cierre', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GhSesionInduccion.prototype, "fechaCierre", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], GhSesionInduccion.prototype, "sede", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'responsable_usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], GhSesionInduccion.prototype, "responsable", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => gh_induccion_asistencia_entity_1.GhInduccionAsistencia, (asistencia) => asistencia.sesion, { cascade: true }),
    __metadata("design:type", Array)
], GhSesionInduccion.prototype, "asistentes", void 0);
exports.GhSesionInduccion = GhSesionInduccion = __decorate([
    (0, typeorm_1.Entity)('gh_sesiones_induccion')
], GhSesionInduccion);
//# sourceMappingURL=gh-sesion-induccion.entity.js.map