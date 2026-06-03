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
exports.UsuarioPermiso = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const usuario_entity_1 = require("./usuario.entity");
let UsuarioPermiso = class UsuarioPermiso extends base_entity_1.BaseEntity {
    usuarioId;
    puedeVer;
    puedeCrear;
    puedeEditar;
    puedeEliminar;
    asignadoPor;
    usuario;
};
exports.UsuarioPermiso = UsuarioPermiso;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'int', unique: true, nullable: false }),
    __metadata("design:type", Number)
], UsuarioPermiso.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'puede_ver',
        type: 'boolean',
        default: true,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], UsuarioPermiso.prototype, "puedeVer", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'puede_crear',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], UsuarioPermiso.prototype, "puedeCrear", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'puede_editar',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], UsuarioPermiso.prototype, "puedeEditar", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'puede_eliminar',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], UsuarioPermiso.prototype, "puedeEliminar", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asignado_por', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UsuarioPermiso.prototype, "asignadoPor", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usuario_entity_1.Usuario, (usuario) => usuario.permisos, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], UsuarioPermiso.prototype, "usuario", void 0);
exports.UsuarioPermiso = UsuarioPermiso = __decorate([
    (0, typeorm_1.Entity)('usuario_permisos'),
    (0, typeorm_1.Unique)('uq_usuario_permisos_unico', ['usuarioId'])
], UsuarioPermiso);
//# sourceMappingURL=usuario-permiso.entity.js.map