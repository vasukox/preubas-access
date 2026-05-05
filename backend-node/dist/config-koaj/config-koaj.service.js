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
var ConfigKoajService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigKoajService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sede_entity_1 = require("../sede/entities/sede.entity");
const ubicacion_entity_1 = require("../sede/entities/ubicacion.entity");
const cat_eps_entity_1 = require("../hse/entities/cat-eps.entity");
const cat_arl_entity_1 = require("../hse/entities/cat-arl.entity");
const cat_afp_entity_1 = require("../hse/entities/cat-afp.entity");
const cat_norma_seguridad_entity_1 = require("../hse/entities/cat-norma-seguridad.entity");
let ConfigKoajService = ConfigKoajService_1 = class ConfigKoajService {
    sedeRepo;
    ubicacionRepo;
    epsRepo;
    arlRepo;
    afpRepo;
    normaRepo;
    logger = new common_1.Logger(ConfigKoajService_1.name);
    constructor(sedeRepo, ubicacionRepo, epsRepo, arlRepo, afpRepo, normaRepo) {
        this.sedeRepo = sedeRepo;
        this.ubicacionRepo = ubicacionRepo;
        this.epsRepo = epsRepo;
        this.arlRepo = arlRepo;
        this.afpRepo = afpRepo;
        this.normaRepo = normaRepo;
    }
    async listarSedes() {
        return this.sedeRepo.find({
            relations: ['ubicaciones'],
            order: { nombre: 'ASC' },
        });
    }
    async getSede(id) {
        const sede = await this.sedeRepo.findOne({
            where: { id },
            relations: ['ubicaciones'],
        });
        if (!sede) {
            throw new common_1.NotFoundException({
                error: { code: 'SEDE_NO_ENCONTRADA', message: `Sede con id ${id} no encontrada.` },
            });
        }
        return sede;
    }
    async crearSede(dto) {
        const existente = await this.sedeRepo.findOne({
            where: [{ nombre: dto.nombre }, { codigo: dto.codigo }],
        });
        if (existente) {
            const campo = existente.nombre === dto.nombre ? 'nombre' : 'código';
            throw new common_1.ConflictException({
                error: {
                    code: 'SEDE_DUPLICADA',
                    message: `Ya existe una sede con ese ${campo}.`,
                },
            });
        }
        const sede = this.sedeRepo.create({
            ...dto,
            ciudad: dto.ciudad ?? 'Bogotá',
            activa: dto.activa ?? true,
            capacidadCarros: dto.capacidadCarros ?? 0,
            capacidadMotos: dto.capacidadMotos ?? 0,
            capacidadBicis: dto.capacidadBicis ?? 0,
            aplicaPicoPlaca: dto.aplicaPicoPlaca ?? false,
        });
        const saved = await this.sedeRepo.save(sede);
        this.logger.log(`Sede creada: [${saved.codigo}] ${saved.nombre} (id=${saved.id})`);
        return saved;
    }
    async actualizarSede(id, dto) {
        const sede = await this.getSede(id);
        Object.assign(sede, dto);
        await this.sedeRepo.save(sede);
        this.logger.log(`Sede actualizada: id=${id}`);
        return this.getSede(id);
    }
    async listarUbicaciones(sedeId) {
        await this.getSede(sedeId);
        return this.ubicacionRepo.find({
            where: { sedeId },
            order: { nombre: 'ASC' },
        });
    }
    async crearUbicacion(dto) {
        await this.getSede(dto.sedeId);
        const duplicada = await this.ubicacionRepo.findOne({
            where: { sedeId: dto.sedeId, nombre: dto.nombre },
        });
        if (duplicada) {
            throw new common_1.ConflictException({
                error: {
                    code: 'UBICACION_DUPLICADA',
                    message: `Ya existe una ubicación con ese nombre en esta sede.`,
                },
            });
        }
        const ubicacion = this.ubicacionRepo.create({
            ...dto,
            tipo: dto.tipo ?? 'GENERAL',
            activa: dto.activa ?? true,
        });
        const saved = await this.ubicacionRepo.save(ubicacion);
        this.logger.log(`Ubicación creada: '${saved.nombre}' en sede ${dto.sedeId} (id=${saved.id})`);
        return saved;
    }
    async actualizarUbicacion(id, dto) {
        const ubicacion = await this.ubicacionRepo.findOne({ where: { id } });
        if (!ubicacion) {
            throw new common_1.NotFoundException({
                error: { code: 'UBICACION_NO_ENCONTRADA', message: `Ubicación con id ${id} no encontrada.` },
            });
        }
        Object.assign(ubicacion, dto);
        const saved = await this.ubicacionRepo.save(ubicacion);
        this.logger.log(`Ubicación actualizada: id=${id}`);
        return saved;
    }
    async eliminarUbicacion(id) {
        const ubicacion = await this.ubicacionRepo.findOne({ where: { id } });
        if (!ubicacion) {
            throw new common_1.NotFoundException({
                error: { code: 'UBICACION_NO_ENCONTRADA', message: `Ubicación con id ${id} no encontrada.` },
            });
        }
        await this.ubicacionRepo.softDelete(id);
        this.logger.log(`Ubicación eliminada (soft): id=${id}`);
    }
    getCatalogoRepo(tipo) {
        const repos = {
            eps: this.epsRepo,
            arl: this.arlRepo,
            afp: this.afpRepo,
        };
        const repo = repos[tipo];
        if (!repo) {
            throw new common_1.BadRequestException({
                error: {
                    code: 'CATALOGO_INVALIDO',
                    message: `Tipo de catálogo '${tipo}' no válido. Use: eps, arl, afp.`,
                },
            });
        }
        return repo;
    }
    async listarCatalogo(tipo) {
        const repo = this.getCatalogoRepo(tipo);
        return repo.find({ order: { nombre: 'ASC' } });
    }
    async crearItemCatalogo(tipo, dto) {
        const repo = this.getCatalogoRepo(tipo);
        const existente = await repo.findOne({ where: { codigo: dto.codigo } });
        if (existente) {
            throw new common_1.ConflictException({
                error: {
                    code: 'CATALOGO_DUPLICADO',
                    message: `Ya existe un item ${tipo.toUpperCase()} con el código '${dto.codigo}'.`,
                },
            });
        }
        const item = repo.create({ ...dto, activa: dto.activa ?? true });
        const saved = await repo.save(item);
        this.logger.log(`Catálogo ${tipo.toUpperCase()} creado: [${dto.codigo}] ${dto.nombre}`);
        return saved;
    }
    async actualizarItemCatalogo(tipo, id, dto) {
        const repo = this.getCatalogoRepo(tipo);
        const item = await repo.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CATALOGO_NO_ENCONTRADO',
                    message: `Item ${tipo.toUpperCase()} con id ${id} no encontrado.`,
                },
            });
        }
        Object.assign(item, dto);
        const saved = await repo.save(item);
        this.logger.log(`Catálogo ${tipo.toUpperCase()} actualizado: id=${id}`);
        return saved;
    }
    async eliminarItemCatalogo(tipo, id) {
        const repo = this.getCatalogoRepo(tipo);
        const item = await repo.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'CATALOGO_NO_ENCONTRADO',
                    message: `Item ${tipo.toUpperCase()} con id ${id} no encontrado.`,
                },
            });
        }
        await repo.softDelete(id);
        this.logger.log(`Catálogo ${tipo.toUpperCase()} eliminado (soft): id=${id}`);
    }
    async listarNormas(sedeId) {
        if (sedeId !== undefined) {
            return this.normaRepo
                .createQueryBuilder('n')
                .where('(n.sede_id = :sedeId OR n.sede_id IS NULL)', { sedeId })
                .andWhere('n.activa = true')
                .orderBy('n.numero', 'ASC')
                .getMany();
        }
        return this.normaRepo.find({
            order: { numero: 'ASC' },
            relations: ['sede'],
        });
    }
    async crearNorma(dto) {
        if (dto.sedeId !== undefined && dto.sedeId !== null) {
            await this.getSede(dto.sedeId);
        }
        const norma = this.normaRepo.create({
            ...dto,
            activa: dto.activa ?? true,
            sedeId: dto.sedeId ?? null,
        });
        const saved = await this.normaRepo.save(norma);
        const scope = dto.sedeId ? `sede ${dto.sedeId}` : 'global';
        this.logger.log(`Norma creada: #${dto.numero} '${dto.titulo}' (${scope})`);
        return saved;
    }
    async actualizarNorma(id, dto) {
        const norma = await this.normaRepo.findOne({
            where: { id },
            relations: ['sede'],
        });
        if (!norma) {
            throw new common_1.NotFoundException({
                error: { code: 'NORMA_NO_ENCONTRADA', message: `Norma con id ${id} no encontrada.` },
            });
        }
        if (dto.sedeId !== undefined && dto.sedeId !== null) {
            await this.getSede(dto.sedeId);
        }
        Object.assign(norma, dto);
        const saved = await this.normaRepo.save(norma);
        this.logger.log(`Norma actualizada: id=${id}`);
        return this.normaRepo.findOne({ where: { id: saved.id }, relations: ['sede'] });
    }
    async eliminarNorma(id) {
        const norma = await this.normaRepo.findOne({ where: { id } });
        if (!norma) {
            throw new common_1.NotFoundException({
                error: { code: 'NORMA_NO_ENCONTRADA', message: `Norma con id ${id} no encontrada.` },
            });
        }
        await this.normaRepo.softDelete(id);
        this.logger.log(`Norma eliminada (soft): id=${id}`);
    }
};
exports.ConfigKoajService = ConfigKoajService;
exports.ConfigKoajService = ConfigKoajService = ConfigKoajService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sede_entity_1.Sede)),
    __param(1, (0, typeorm_1.InjectRepository)(ubicacion_entity_1.Ubicacion)),
    __param(2, (0, typeorm_1.InjectRepository)(cat_eps_entity_1.CatEps)),
    __param(3, (0, typeorm_1.InjectRepository)(cat_arl_entity_1.CatArl)),
    __param(4, (0, typeorm_1.InjectRepository)(cat_afp_entity_1.CatAfp)),
    __param(5, (0, typeorm_1.InjectRepository)(cat_norma_seguridad_entity_1.CatNormaSeguridad)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ConfigKoajService);
//# sourceMappingURL=config-koaj.service.js.map