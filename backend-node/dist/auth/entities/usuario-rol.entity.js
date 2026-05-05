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
exports.UsuarioRol = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const usuario_entity_1 = require("./usuario.entity");
const rol_entity_1 = require("./rol.entity");
let UsuarioRol = class UsuarioRol extends base_entity_1.BaseEntity {
    usuarioId;
    rolId;
    asignadoPor;
    usuario;
    rol;
};
exports.UsuarioRol = UsuarioRol;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], UsuarioRol.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rol_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], UsuarioRol.prototype, "rolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asignado_por', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UsuarioRol.prototype, "asignadoPor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, (usuario) => usuario.roles, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], UsuarioRol.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rol_entity_1.Rol, (rol) => rol.usuarioRoles, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'rol_id' }),
    __metadata("design:type", rol_entity_1.Rol)
], UsuarioRol.prototype, "rol", void 0);
exports.UsuarioRol = UsuarioRol = __decorate([
    (0, typeorm_1.Entity)('usuario_roles'),
    (0, typeorm_1.Unique)('uq_usuario_rol', ['usuarioId', 'rolId'])
], UsuarioRol);
//# sourceMappingURL=usuario-rol.entity.js.map