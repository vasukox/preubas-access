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
exports.HseSegSocial = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const cat_eps_entity_1 = require("./cat-eps.entity");
const cat_arl_entity_1 = require("./cat-arl.entity");
const cat_afp_entity_1 = require("./cat-afp.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseSegSocial = class HseSegSocial extends base_entity_1.BaseEntity {
    contratistaId;
    esTitular;
    nombrePersona;
    cedulaPersona;
    epsId;
    epsVigencia;
    arlId;
    arlVigencia;
    afpId;
    afpVigencia;
    pilaTipo;
    pilaEstado;
    pilaArchivo;
    sstTieneVigente;
    sstResponsableNombre;
    sstResolucionRegistro;
    contratista;
    eps;
    arl;
    afp;
};
exports.HseSegSocial = HseSegSocial;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int' }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_titular', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], HseSegSocial.prototype, "esTitular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_persona', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "nombrePersona", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cedula_persona', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "cedulaPersona", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'eps_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "epsId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'eps_vigencia', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseSegSocial.prototype, "epsVigencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'arl_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "arlId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'arl_vigencia', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseSegSocial.prototype, "arlVigencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'afp_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "afpId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'afp_vigencia', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HseSegSocial.prototype, "afpVigencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pila_tipo', type: 'enum', enum: hse_enum_1.PilaTipo, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "pilaTipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pila_estado', type: 'enum', enum: hse_enum_1.PilaEstado, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "pilaEstado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pila_archivo', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "pilaArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sst_tiene_vigente', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HseSegSocial.prototype, "sstTieneVigente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sst_responsable_nombre', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "sstResponsableNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sst_resolucion_registro', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "sstResolucionRegistro", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.seguridadSocial, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseSegSocial.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_eps_entity_1.CatEps, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'eps_id' }),
    __metadata("design:type", cat_eps_entity_1.CatEps)
], HseSegSocial.prototype, "eps", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_arl_entity_1.CatArl, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'arl_id' }),
    __metadata("design:type", cat_arl_entity_1.CatArl)
], HseSegSocial.prototype, "arl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_afp_entity_1.CatAfp, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'afp_id' }),
    __metadata("design:type", cat_afp_entity_1.CatAfp)
], HseSegSocial.prototype, "afp", void 0);
exports.HseSegSocial = HseSegSocial = __decorate([
    (0, typeorm_1.Entity)('hse_seguridad_social')
], HseSegSocial);
//# sourceMappingURL=hse-seg-social.entity.js.map