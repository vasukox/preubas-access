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
exports.HseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sede_entity_1 = require("../sede/entities/sede.entity");
const cat_eps_entity_1 = require("./entities/cat-eps.entity");
const hse_autorizacion_entity_1 = require("./entities/hse-autorizacion.entity");
const hse_enum_1 = require("../common/enums/hse.enum");
let HseService = class HseService {
    sedeRepo;
    epsRepo;
    autorizacionRepo;
    constructor(sedeRepo, epsRepo, autorizacionRepo) {
        this.sedeRepo = sedeRepo;
        this.epsRepo = epsRepo;
        this.autorizacionRepo = autorizacionRepo;
    }
    async getCatalogosSedes(usuario) {
        const roles = usuario.roles || [];
        if (roles.includes('ADMIN_GLOBAL') || roles.includes('ADMIN_HSE')) {
            return this.sedeRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
        }
        if (usuario.sedeAsignadaId) {
            return this.sedeRepo.find({ where: { id: usuario.sedeAsignadaId, activa: true } });
        }
        return [];
    }
    async getCatalogosEps() {
        return this.epsRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    async getAutorizaciones(sedeId, estado, page = 1, perPage = 20) {
        const skip = (page - 1) * perPage;
        const whereClause = { sedeId };
        if (estado) {
            whereClause.estado = estado;
        }
        const [items, total] = await this.autorizacionRepo.findAndCount({
            where: whereClause,
            order: { created_at: 'DESC' },
            skip,
            take: perPage,
            relations: ['proveedor', 'creador', 'responsableInterno'],
        });
        return {
            items: items,
            total: total
        };
    }
    async getDashboard(sedeId) {
        const total = await this.autorizacionRepo.count({ where: { sedeId } });
        const activas = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.APROBADO } });
        const pendientes = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.EN_REVISION } });
        const vencidas = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.VENCIDO } });
        return {
            totalAutorizaciones: total,
            autorizacionesActivas: activas,
            autorizacionesPendientes: pendientes,
            autorizacionesVencidas: vencidas,
            totalContratistas: 0,
            contratistasDentroAhora: 0,
            altoRiesgoActivos: 0,
            normalActivos: 0,
            alertasActivas: 0,
        };
    }
};
exports.HseService = HseService;
exports.HseService = HseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sede_entity_1.Sede)),
    __param(1, (0, typeorm_1.InjectRepository)(cat_eps_entity_1.CatEps)),
    __param(2, (0, typeorm_1.InjectRepository)(hse_autorizacion_entity_1.HseAutorizacion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HseService);
//# sourceMappingURL=hse.service.js.map