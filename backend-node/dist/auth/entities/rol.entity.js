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
exports.Rol = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const rol_enum_1 = require("../../common/enums/rol.enum");
const usuario_rol_entity_1 = require("./usuario-rol.entity");
let Rol = class Rol extends base_entity_1.BaseEntity {
    nombre;
    descripcion;
    activo;
    usuarioRoles;
};
exports.Rol = Rol;
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: rol_enum_1.RolNombre, unique: true, nullable: false }),
    __metadata("design:type", String)
], Rol.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Rol.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Rol.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => usuario_rol_entity_1.UsuarioRol, (usuarioRol) => usuarioRol.rol, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Rol.prototype, "usuarioRoles", void 0);
exports.Rol = Rol = __decorate([
    (0, typeorm_1.Entity)('cat_roles')
], Rol);
//# sourceMappingURL=rol.entity.js.map