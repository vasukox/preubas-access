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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gh_cita_entity_1 = require("./entities/gh-cita.entity");
let GhService = class GhService {
    citaRepo;
    constructor(citaRepo) {
        this.citaRepo = citaRepo;
    }
    async getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, page = 1, perPage = 20) {
        const skip = (page - 1) * perPage;
        const query = this.citaRepo.createQueryBuilder('c')
            .where('c.sedeId = :sedeId', { sedeId })
            .leftJoinAndSelect('c.persona', 'persona')
            .leftJoinAndSelect('c.usuario', 'usuario');
        if (estado) {
            query.andWhere('c.estado = :estado', { estado });
        }
        if (tipoCita) {
            query.andWhere('c.tipoCita = :tipoCita', { tipoCita });
        }
        if (fechaDesde) {
            query.andWhere('c.fechaInicio >= :fechaDesde', { fechaDesde });
        }
        if (fechaHasta) {
            query.andWhere('c.fechaFin <= :fechaHasta', { fechaHasta });
        }
        if (busqueda) {
            query.andWhere('(persona.nombres LIKE :busqueda OR persona.apellidos LIKE :busqueda OR persona.numeroIdentificacion LIKE :busqueda)', { busqueda: `%${busqueda}%` });
        }
        const items = await query
            .orderBy('c.fechaInicio', 'DESC')
            .skip(skip)
            .take(perPage)
            .getMany();
        return items;
    }
};
exports.GhService = GhService;
exports.GhService = GhService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gh_cita_entity_1.GhCita)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GhService);
//# sourceMappingURL=gh.service.js.map