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
exports.Usuario = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sede_entity_1 = require("../../sede/entities/sede.entity");
const usuario_rol_entity_1 = require("./usuario-rol.entity");
const refresh_token_entity_1 = require("./refresh-token.entity");
const perfil_entity_1 = require("./perfil.entity");
const usuario_permiso_entity_1 = require("./usuario-permiso.entity");
const usuario_sede_entity_1 = require("./usuario-sede.entity");
let Usuario = class Usuario extends base_entity_1.BaseEntity {
    email;
    passwordHash;
    nombreCompleto;
    activo;
    debeCambiarPassword;
    ultimoLogin;
    intentosFallidos;
    bloqueadoHasta;
    sedeAsignadaId;
    sedeAsignada;
    roles;
    refreshTokens;
    perfil;
    permisos;
    sedesAsignadas;
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, unique: true, nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'password_hash',
        type: 'varchar',
        length: 255,
        nullable: false,
    }),
    __metadata("design:type", String)
], Usuario.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'nombre_completo',
        type: 'varchar',
        length: 150,
        nullable: false,
    }),
    __metadata("design:type", String)
], Usuario.prototype, "nombreCompleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'debe_cambiar_password',
        type: 'boolean',
        default: true,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "debeCambiarPassword", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_login', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "ultimoLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'intentos_fallidos',
        type: 'int',
        default: 0,
        nullable: false,
    }),
    __metadata("design:type", Number)
], Usuario.prototype, "intentosFallidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bloqueado_hasta', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "bloqueadoHasta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sede_asignada_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Usuario.prototype, "sedeAsignadaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sede_entity_1.Sede, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sede_asignada_id' }),
    __metadata("design:type", sede_entity_1.Sede)
], Usuario.prototype, "sedeAsignada", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => usuario_rol_entity_1.UsuarioRol, (usuarioRol) => usuarioRol.usuario, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Usuario.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refresh_token_entity_1.RefreshToken, (refreshToken) => refreshToken.usuario, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Usuario.prototype, "refreshTokens", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => perfil_entity_1.Perfil, (perfil) => perfil.usuario, {
        cascade: true,
    }),
    __metadata("design:type", perfil_entity_1.Perfil)
], Usuario.prototype, "perfil", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usuario_permiso_entity_1.UsuarioPermiso, (permiso) => permiso.usuario, {
        cascade: true,
    }),
    __metadata("design:type", usuario_permiso_entity_1.UsuarioPermiso)
], Usuario.prototype, "permisos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => usuario_sede_entity_1.UsuarioSede, (usuarioSede) => usuarioSede.usuario, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Usuario.prototype, "sedesAsignadas", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], Usuario);
//# sourceMappingURL=usuario.entity.js.map