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
exports.Perfil = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const usuario_entity_1 = require("./usuario.entity");
let Perfil = class Perfil extends base_entity_1.BaseEntity {
    usuarioId;
    fotoPerfil;
    biografia;
    ubicacion;
    telefono;
    sedeDefaultId;
    tema;
    notificacionesEmail;
    usuario;
};
exports.Perfil = Perfil;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', unique: true, nullable: false }),
    __metadata("design:type", Number)
], Perfil.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'foto_perfil', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Perfil.prototype, "fotoPerfil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Perfil.prototype, "biografia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], Perfil.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Perfil.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_default_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Perfil.prototype, "sedeDefaultId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'dark', nullable: false }),
    __metadata("design:type", String)
], Perfil.prototype, "tema", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'notificaciones_email',
        type: 'boolean',
        default: true,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], Perfil.prototype, "notificacionesEmail", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usuario_entity_1.Usuario, (usuario) => usuario.perfil, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Perfil.prototype, "usuario", void 0);
exports.Perfil = Perfil = __decorate([
    (0, typeorm_1.Entity)('perfiles')
], Perfil);
//# sourceMappingURL=perfil.entity.js.map