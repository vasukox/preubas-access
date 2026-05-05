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
exports.RefreshToken = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const usuario_entity_1 = require("./usuario.entity");
let RefreshToken = class RefreshToken extends base_entity_1.BaseEntity {
    usuarioId;
    jti;
    revocado;
    expiraEn;
    userAgent;
    ipAddress;
    usuario;
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], RefreshToken.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, unique: true, nullable: false }),
    __metadata("design:type", String)
], RefreshToken.prototype, "jti", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], RefreshToken.prototype, "revocado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expira_en', type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expiraEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (usuario) => usuario.refreshTokens, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], RefreshToken.prototype, "usuario", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, typeorm_1.Entity)('refresh_tokens')
], RefreshToken);
//# sourceMappingURL=refresh-token.entity.js.map