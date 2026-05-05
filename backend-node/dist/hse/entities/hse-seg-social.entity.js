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
let HseSegSocial = class HseSegSocial extends base_entity_1.BaseEntity {
    contratistaId;
    epsId;
    arlId;
    afpId;
    urlPlanilla;
    fechaInicioCobertura;
    fechaFinCobertura;
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
    (0, typeorm_1.Column)({ name: 'eps_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "epsId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'arl_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "arlId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'afp_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], HseSegSocial.prototype, "afpId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url_planilla', type: 'text', nullable: false }),
    __metadata("design:type", String)
], HseSegSocial.prototype, "urlPlanilla", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio_cobertura', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseSegSocial.prototype, "fechaInicioCobertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin_cobertura', type: 'date', nullable: false }),
    __metadata("design:type", Date)
], HseSegSocial.prototype, "fechaFinCobertura", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.seguridadSocial, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseSegSocial.prototype, "contratista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_eps_entity_1.CatEps, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'eps_id' }),
    __metadata("design:type", cat_eps_entity_1.CatEps)
], HseSegSocial.prototype, "eps", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_arl_entity_1.CatArl, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'arl_id' }),
    __metadata("design:type", cat_arl_entity_1.CatArl)
], HseSegSocial.prototype, "arl", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cat_afp_entity_1.CatAfp, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'afp_id' }),
    __metadata("design:type", cat_afp_entity_1.CatAfp)
], HseSegSocial.prototype, "afp", void 0);
exports.HseSegSocial = HseSegSocial = __decorate([
    (0, typeorm_1.Entity)('hse_seg_social')
], HseSegSocial);
//# sourceMappingURL=hse-seg-social.entity.js.map