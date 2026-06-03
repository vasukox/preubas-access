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
exports.HseContratista = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_autorizacion_entity_1 = require("./hse-autorizacion.entity");
const persona_entity_1 = require("../../persona/entities/persona.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
const hse_clasificacion_entity_1 = require("./hse-clasificacion.entity");
const hse_seg_social_entity_1 = require("./hse-seg-social.entity");
const hse_certificaciones_entity_1 = require("./hse-certificaciones.entity");
const hse_examen_medico_entity_1 = require("./hse-examen-medico.entity");
const hse_contacto_emergencia_entity_1 = require("./hse-contacto-emergencia.entity");
const hse_aceptacion_normas_entity_1 = require("./hse-aceptacion-normas.entity");
const hse_acceso_entity_1 = require("./hse-acceso.entity");
const hse_cumplimiento_entity_1 = require("./hse-cumplimiento.entity");
const hse_historial_entity_1 = require("./hse-historial.entity");
let HseContratista = class HseContratista extends base_entity_1.BaseEntity {
    autorizacionId;
    personaId;
    tipoDocumento;
    numeroDocumento;
    nombres;
    apellidos;
    email;
    telefono;
    esExtranjero;
    estado;
    motivoDenegacion;
    tokenAutogestion;
    tokenExpiraEn;
    tokenDuracionHoras;
    autogestionCompletadaEn;
    sstResponsableNombre;
    sstResponsableTelefono;
    autorizacion;
    persona;
    clasificacion;
    seguridadSocial;
    certificaciones;
    examenMedico;
    contactoEmergencia;
    aceptacionNormas;
    accesos;
    cumplimientos;
    historial;
};
exports.HseContratista = HseContratista;
__decorate([
    (0, typeorm_1.Column)({ name: 'autorizacion_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], HseContratista.prototype, "autorizacionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'persona_id',
        type: 'int',
        nullable: true,
        comment: 'Se vincula cuando la persona ya existe en BD',
    }),
    __metadata("design:type", Number)
], HseContratista.prototype, "personaId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tipo_documento',
        type: 'enum',
        enum: hse_enum_1.TipoDocumento,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "tipoDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'numero_documento',
        type: 'varchar',
        length: 30,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "numeroDocumento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], HseContratista.prototype, "nombres", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], HseContratista.prototype, "apellidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], HseContratista.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], HseContratista.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'es_extranjero',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], HseContratista.prototype, "esExtranjero", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: hse_enum_1.EstadoContratista,
        default: hse_enum_1.EstadoContratista.PENDIENTE_AUTOGESTION,
        nullable: false,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motivo_denegacion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseContratista.prototype, "motivoDenegacion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'token_autogestion',
        type: 'varchar',
        length: 64,
        unique: true,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "tokenAutogestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_expira_en', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], HseContratista.prototype, "tokenExpiraEn", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'token_duracion_horas',
        type: 'int',
        nullable: true,
        comment: '24, 48, 72 o personalizado',
    }),
    __metadata("design:type", Number)
], HseContratista.prototype, "tokenDuracionHoras", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'autogestion_completada_en',
        type: 'datetime',
        nullable: true,
    }),
    __metadata("design:type", Date)
], HseContratista.prototype, "autogestionCompletadaEn", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sst_responsable_nombre',
        type: 'varchar',
        length: 150,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "sstResponsableNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sst_responsable_telefono',
        type: 'varchar',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", String)
], HseContratista.prototype, "sstResponsableTelefono", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_autorizacion_entity_1.HseAutorizacion, (autorizacion) => autorizacion.contratistas, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'autorizacion_id' }),
    __metadata("design:type", hse_autorizacion_entity_1.HseAutorizacion)
], HseContratista.prototype, "autorizacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.Persona, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'persona_id' }),
    __metadata("design:type", persona_entity_1.Persona)
], HseContratista.prototype, "persona", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_clasificacion_entity_1.HseClasificacion, (clasificacion) => clasificacion.contratista, { cascade: true }),
    __metadata("design:type", hse_clasificacion_entity_1.HseClasificacion)
], HseContratista.prototype, "clasificacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_seg_social_entity_1.HseSegSocial, (segSocial) => segSocial.contratista, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], HseContratista.prototype, "seguridadSocial", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_certificaciones_entity_1.HseCertificaciones, (cert) => cert.contratista, {
        cascade: true,
    }),
    __metadata("design:type", hse_certificaciones_entity_1.HseCertificaciones)
], HseContratista.prototype, "certificaciones", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_examen_medico_entity_1.HseExamenMedico, (examen) => examen.contratista, {
        cascade: true,
    }),
    __metadata("design:type", hse_examen_medico_entity_1.HseExamenMedico)
], HseContratista.prototype, "examenMedico", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contacto_emergencia_entity_1.HseContactoEmergencia, (contacto) => contacto.contratista, {
        cascade: true,
    }),
    __metadata("design:type", hse_contacto_emergencia_entity_1.HseContactoEmergencia)
], HseContratista.prototype, "contactoEmergencia", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_aceptacion_normas_entity_1.HseAceptacionNormas, (aceptacion) => aceptacion.contratista, {
        cascade: true,
    }),
    __metadata("design:type", hse_aceptacion_normas_entity_1.HseAceptacionNormas)
], HseContratista.prototype, "aceptacionNormas", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_acceso_entity_1.HseAcceso, (acceso) => acceso.contratista, { cascade: true }),
    __metadata("design:type", Array)
], HseContratista.prototype, "accesos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_cumplimiento_entity_1.HseCumplimiento, (cumplimiento) => cumplimiento.contratista, { cascade: true }),
    __metadata("design:type", Array)
], HseContratista.prototype, "cumplimientos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_historial_entity_1.HseHistorial, (historial) => historial.contratista, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], HseContratista.prototype, "historial", void 0);
exports.HseContratista = HseContratista = __decorate([
    (0, typeorm_1.Entity)('hse_contratistas')
], HseContratista);
//# sourceMappingURL=hse-contratista.entity.js.map