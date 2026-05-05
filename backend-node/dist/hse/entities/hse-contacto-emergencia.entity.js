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
exports.HseContactoEmergencia = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const hse_contratista_entity_1 = require("./hse-contratista.entity");
const hse_enum_1 = require("../../common/enums/hse.enum");
let HseContactoEmergencia = class HseContactoEmergencia extends base_entity_1.BaseEntity {
    contratistaId;
    nombreCompleto;
    relacion;
    relacionOtro;
    telefonoCelular;
    telefonoFijo;
    rhSanguineo;
    alergias;
    condicionMedica;
    epsContratista;
    contratista;
};
exports.HseContactoEmergencia = HseContactoEmergencia;
__decorate([
    (0, typeorm_1.Column)({ name: 'contratista_id', type: 'int', unique: true, nullable: false }),
    __metadata("design:type", Number)
], HseContactoEmergencia.prototype, "contratistaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_completo', type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "nombreCompleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: hse_enum_1.RelacionEmergencia, nullable: false }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "relacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'relacion_otro', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "relacionOtro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_celular', type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "telefonoCelular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_fijo', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "telefonoFijo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rh_sanguineo', type: 'enum', enum: hse_enum_1.RhSanguineo, nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "rhSanguineo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "alergias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'condicion_medica', type: 'text', nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "condicionMedica", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'eps_contratista', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], HseContactoEmergencia.prototype, "epsContratista", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => hse_contratista_entity_1.HseContratista, (contratista) => contratista.contactoEmergencia, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'contratista_id' }),
    __metadata("design:type", hse_contratista_entity_1.HseContratista)
], HseContactoEmergencia.prototype, "contratista", void 0);
exports.HseContactoEmergencia = HseContactoEmergencia = __decorate([
    (0, typeorm_1.Entity)('hse_contacto_emergencia')
], HseContactoEmergencia);
//# sourceMappingURL=hse-contacto-emergencia.entity.js.map