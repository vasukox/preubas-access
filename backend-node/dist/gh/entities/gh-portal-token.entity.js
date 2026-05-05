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
exports.GhPortalToken = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const gh_cita_entity_1 = require("./gh-cita.entity");
let GhPortalToken = class GhPortalToken extends base_entity_1.BaseEntity {
    citaId;
    token;
    expiraEn;
    usadoEn;
    cita;
};
exports.GhPortalToken = GhPortalToken;
__decorate([
    (0, typeorm_1.Column)({ name: 'cita_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], GhPortalToken.prototype, "citaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: false, unique: true }),
    __metadata("design:type", String)
], GhPortalToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expira_en', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], GhPortalToken.prototype, "expiraEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usado_en', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GhPortalToken.prototype, "usadoEn", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gh_cita_entity_1.GhCita, (cita) => cita.tokensPortal, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cita_id' }),
    __metadata("design:type", gh_cita_entity_1.GhCita)
], GhPortalToken.prototype, "cita", void 0);
exports.GhPortalToken = GhPortalToken = __decorate([
    (0, typeorm_1.Entity)('gh_portal_tokens')
], GhPortalToken);
//# sourceMappingURL=gh-portal-token.entity.js.map