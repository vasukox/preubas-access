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
exports.HseClasificacion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseClasificacion = class HseClasificacion extends base_entity_1.BaseEntity {
    contratistaId;
    trabajoAlturas;
    espaciosConfinados;
    trabajoElectrico;
    trabajoCaliente;
    izajeMaquinaria;
    visitaSinRiesgo;
    personalExtranjero;
    generaResiduos;
    alturasNivel;
    alturasCertFechaVenc;
    alturasCertArchivo;
    confinadosRol;
    confinadosCertFecha;
    confinadosCertArchivo;
    electricoMatriculaContec;
    electricoNumMatricula;
    electricoMatriculaVenc;
    electricoMatriculaArchivo;
    calienteExtintorFecha;
    calienteExtintorArchivo;
    calientePermisoFecha;
    calientePermisoArchivo;
    izajeTipoEquipo;
    izajeInspeccionArchivo;
    izajeDocLegalArchivo;
    izajeLicenciaArchivo;
    extranAseguradora;
    extranNumPoliza;
    extranPolizaVenc;
    extranPolizaArchivo;
    residuosTipo;
    residuosPlanArchivo;
    contratista;
};
exports.HseClasificacion = HseClasificacion;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true }),
    __metadata("design:type", Number)
], HseClasificacion.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trabajo_alturas', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "trabajoAlturas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'espacios_confinados', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "espaciosConfinados", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trabajo_electrico', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "trabajoElectrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trabajo_caliente', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "trabajoCaliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'izaje_maquinaria', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "izajeMaquinaria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'visita_sin_riesgo', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "visitaSinRiesgo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'personal_extranjero', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "personalExtranjero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'genera_residuos', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseClasificacion.prototype, "generaResiduos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alturas_nivel', type: 'enum', enum: hse_enum_1.AlturasNivel, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "alturasNivel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alturas_cert_fecha_venc', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "alturasCertFechaVenc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alturas_cert_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "alturasCertArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confinados_rol', type: 'enum', enum: hse_enum_1.ConfinadosRol, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "confinadosRol", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confinados_cert_fecha', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "confinadosCertFecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confinados_cert_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "confinadosCertArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'electrico_matricula_contec', type: 'enum', enum: hse_enum_1.ElectricoMatricula, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "electricoMatriculaContec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'electrico_num_matricula', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "electricoNumMatricula", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'electrico_matricula_venc', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "electricoMatriculaVenc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'electrico_matricula_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "electricoMatriculaArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'caliente_extintor_fecha', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "calienteExtintorFecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'caliente_extintor_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "calienteExtintorArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'caliente_permiso_fecha', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "calientePermisoFecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'caliente_permiso_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "calientePermisoArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'izaje_tipo_equipo', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "izajeTipoEquipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'izaje_inspeccion_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "izajeInspeccionArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'izaje_doc_legal_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "izajeDocLegalArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'izaje_licencia_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "izajeLicenciaArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extran_aseguradora', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "extranAseguradora", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extran_num_poliza', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "extranNumPoliza", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extran_poliza_venc', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseClasificacion.prototype, "extranPolizaVenc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extran_poliza_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "extranPolizaArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'residuos_tipo', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "residuosTipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'residuos_plan_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseClasificacion.prototype, "residuosPlanArchivo", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.clasificacion, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseClasificacion.prototype, "contratista", void 0);
exports.HseClasificacion = HseClasificacion = __decorate([
    (0, typeorm_1.Entity)('hse_clasificacion_actividad')
], HseClasificacion);
//# sourceMappingURL=hse-clasificacion.entity.js.map