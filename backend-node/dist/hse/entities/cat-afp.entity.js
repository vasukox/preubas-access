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
exports.CatAfp = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_seg_social_entity_1 = require("./hse-seg-social.entity");
let CatAfp = class CatAfp extends base_entity_1.BaseEntity {
    nombre;
    codigo;
    activa;
    seguridadSocial;
};
exports.CatAfp = CatAfp;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], CatAfp.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, nullable: false }),
    __metadata("design:type", String)
], CatAfp.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], CatAfp.prototype, "activa", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => hse_seg_social_entity_1.HseSegSocial, (segSocial) => segSocial.afp),
    __metadata("design:type", Array)
], CatAfp.prototype, "seguridadSocial", void 0);
exports.CatAfp = CatAfp = __decorate([
    (0, typeorm_1.Entity)('cat_afp')
], CatAfp);
//# sourceMappingURL=cat-afp.entity.js.map