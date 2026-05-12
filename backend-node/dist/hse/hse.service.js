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
const cat_arl_entity_1 = require("./entities/cat-arl.entity");
const cat_afp_entity_1 = require("./entities/cat-afp.entity");
const cat_norma_seguridad_entity_1 = require("./entities/cat-norma-seguridad.entity");
const hse_autorizacion_entity_1 = require("./entities/hse-autorizacion.entity");
const hse_contratista_entity_1 = require("./entities/hse-contratista.entity");
const hse_acceso_entity_1 = require("./entities/hse-acceso.entity");
const hse_enum_1 = require("../common/enums/hse.enum");
const acceso_service_1 = require("./services/acceso.service");
let HseService = class HseService {
    sedeRepo;
    epsRepo;
    arlRepo;
    afpRepo;
    normaRepo;
    autorizacionRepo;
    contratistaRepo;
    accesoRepo;
    accesoService;
    constructor(sedeRepo, epsRepo, arlRepo, afpRepo, normaRepo, autorizacionRepo, contratistaRepo, accesoRepo, accesoService) {
        this.sedeRepo = sedeRepo;
        this.epsRepo = epsRepo;
        this.arlRepo = arlRepo;
        this.afpRepo = afpRepo;
        this.normaRepo = normaRepo;
        this.autorizacionRepo = autorizacionRepo;
        this.contratistaRepo = contratistaRepo;
        this.accesoRepo = accesoRepo;
        this.accesoService = accesoService;
    }
    async getCatalogosSedes(usuario) {
        return this.sedeRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    async getCatalogosEps() {
        return this.epsRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    async getCatalogosArl() {
        return this.arlRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    async getCatalogosAfp() {
        return this.afpRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    async getCatalogosNormas(sedeId) {
        return this.normaRepo.find({
            where: [
                { activa: true, sedeId: sedeId },
                { activa: true, sedeId: (0, typeorm_2.IsNull)() }
            ],
            order: { numero: 'ASC' }
        });
    }
    async getDashboard(sedeId) {
        const total = await this.autorizacionRepo.count({ where: { sedeId } });
        const activas = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.APROBADO } });
        const pendientes = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.EN_REVISION } });
        const vencidas = await this.autorizacionRepo.count({ where: { sedeId, estado: hse_enum_1.EstadoAutorizacion.VENCIDO } });
        const totalContratistas = await this.contratistaRepo
            .createQueryBuilder('contratista')
            .innerJoin('contratista.autorizacion', 'autorizacion')
            .where('autorizacion.sedeId = :sedeId', { sedeId })
            .andWhere('autorizacion.deleted_at IS NULL')
            .andWhere('contratista.deleted_at IS NULL')
            .getCount();
        const contratistasActivos = await this.contratistaRepo
            .createQueryBuilder('contratista')
            .innerJoin('contratista.autorizacion', 'autorizacion')
            .where('autorizacion.sedeId = :sedeId', { sedeId })
            .andWhere('autorizacion.deleted_at IS NULL')
            .andWhere('contratista.deleted_at IS NULL')
            .andWhere('contratista.estado = :estado', { estado: hse_enum_1.EstadoContratista.APROBADO })
            .select(['contratista.id AS id', 'autorizacion.tipo_contratista AS tipoContratista'])
            .getRawMany();
        const altoRiesgoActivos = contratistasActivos.filter((row) => row.tipoContratista === hse_enum_1.TipoContratista.ALTO_RIESGO).length;
        const normalActivos = contratistasActivos.filter((row) => row.tipoContratista === hse_enum_1.TipoContratista.NORMAL).length;
        const personasDentro = await this.accesoService.getPersonasDentro(sedeId);
        const dentroCount = personasDentro.length;
        const alertasActivas = personasDentro.filter((persona) => persona.alertaTiempo).length;
        return {
            totalAutorizaciones: total,
            autorizacionesActivas: activas,
            autorizacionesPendientes: pendientes,
            autorizacionesVencidas: vencidas,
            totalContratistas,
            contratistasDentroAhora: dentroCount,
            altoRiesgoActivos,
            normalActivos,
            alertasActivas,
        };
    }
};
exports.HseService = HseService;
exports.HseService = HseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sede_entity_1.Sede)),
    __param(1, (0, typeorm_1.InjectRepository)(cat_eps_entity_1.CatEps)),
    __param(2, (0, typeorm_1.InjectRepository)(cat_arl_entity_1.CatArl)),
    __param(3, (0, typeorm_1.InjectRepository)(cat_afp_entity_1.CatAfp)),
    __param(4, (0, typeorm_1.InjectRepository)(cat_norma_seguridad_entity_1.CatNormaSeguridad)),
    __param(5, (0, typeorm_1.InjectRepository)(hse_autorizacion_entity_1.HseAutorizacion)),
    __param(6, (0, typeorm_1.InjectRepository)(hse_contratista_entity_1.HseContratista)),
    __param(7, (0, typeorm_1.InjectRepository)(hse_acceso_entity_1.HseAcceso)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        acceso_service_1.AccesoService])
], HseService);
//# sourceMappingURL=hse.service.js.map