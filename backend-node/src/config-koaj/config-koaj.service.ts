import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sede } from '../sede/entities/sede.entity';
import { Ubicacion } from '../sede/entities/ubicacion.entity';
import { CatEps } from '../hse/entities/cat-eps.entity';
import { CatArl } from '../hse/entities/cat-arl.entity';
import { CatAfp } from '../hse/entities/cat-afp.entity';
import { CatNormaSeguridad } from '../hse/entities/cat-norma-seguridad.entity';
import { ConfigTiemposContratista, TipoContratistaConfig } from './entities/config-tiempos-contratista.entity';

import {
  CreateSedeDto,
  UpdateSedeDto,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  CreateCatalogoDto,
  UpdateCatalogoDto,
  CreateNormaDto,
  UpdateNormaDto,
  UpdateTiemposContratistaDto,
} from './dto/config-koaj.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Tipo auxiliar para los catálogos EPS/ARL/AFP (todos comparten el mismo schema)
// ─────────────────────────────────────────────────────────────────────────────
type TipoCatalogo = 'eps' | 'arl' | 'afp';

/**
 * ConfigKoajService — lógica de negocio para la configuración global del sistema.
 *
 * Equivalente a los servicios en `app/services/` y la lógica de `app/routers/config.py`.
 *
 * Módulos que sirve:
 *  - Sedes (CRUD completo)
 *  - Ubicaciones (CRUD por sede)
 *  - Catálogos: EPS, ARL, AFP (CRUD genérico polimórfico)
 *  - Normas de Seguridad (CRUD con scope por sede)
 *
 * Acceso: solo ADMIN_GLOBAL (validado en el controller con RolesGuard).
 */
@Injectable()
export class ConfigKoajService {
  private readonly logger = new Logger(ConfigKoajService.name);

  private static readonly TIEMPOS_DEFAULTS: Record<TipoContratistaConfig, Partial<ConfigTiemposContratista>> = {
    [TipoContratistaConfig.NORMAL]:      { tokenDuracionHoras: 72, autorizacionDuracionDias: 30, alertaVencimientoDias: 3,  requiereExamenMedico: false, requiereSeguridadSocial: false },
    [TipoContratistaConfig.ALTO_RIESGO]: { tokenDuracionHoras: 72, autorizacionDuracionDias: 15, alertaVencimientoDias: 5,  requiereExamenMedico: true,  requiereSeguridadSocial: true  },
    [TipoContratistaConfig.EXCEPCION]:   { tokenDuracionHoras: 72, autorizacionDuracionDias: 7,  alertaVencimientoDias: 2,  requiereExamenMedico: false, requiereSeguridadSocial: false },
  };

  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepo: Repository<Sede>,

    @InjectRepository(Ubicacion)
    private readonly ubicacionRepo: Repository<Ubicacion>,

    @InjectRepository(CatEps)
    private readonly epsRepo: Repository<CatEps>,

    @InjectRepository(CatArl)
    private readonly arlRepo: Repository<CatArl>,

    @InjectRepository(CatAfp)
    private readonly afpRepo: Repository<CatAfp>,

    @InjectRepository(CatNormaSeguridad)
    private readonly normaRepo: Repository<CatNormaSeguridad>,

    @InjectRepository(ConfigTiemposContratista)
    private readonly tiemposRepo: Repository<ConfigTiemposContratista>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // SEDES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista todas las sedes con sus ubicaciones cargadas.
   * Equivalente a GET /config/sedes en Python.
   */
  async listarSedes(): Promise<Sede[]> {
    return this.sedeRepo.find({
      relations: ['ubicaciones'],
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Retorna una sede por ID con ubicaciones.
   * Lanza 404 si no existe.
   */
  async getSede(id: number): Promise<Sede> {
    const sede = await this.sedeRepo.findOne({
      where: { id },
      relations: ['ubicaciones'],
    });

    if (!sede) {
      throw new NotFoundException({
        error: { code: 'SEDE_NO_ENCONTRADA', message: `Sede con id ${id} no encontrada.` },
      });
    }

    return sede;
  }

  /**
   * Crea una nueva sede.
   * Valida unicidad de nombre y código antes de insertar.
   */
  async crearSede(dto: CreateSedeDto): Promise<Sede> {
    const nombre = dto.nombre.trim();
    const codigo = dto.codigo?.trim() || (await this.generarCodigoSede(nombre));
    // Verificar unicidad de nombre y código
    const existente = await this.sedeRepo.findOne({
      where: [{ nombre }, { codigo }],
    });

    if (existente) {
      const campo = existente.nombre === nombre ? 'nombre' : 'codigo';
      throw new ConflictException({
        error: {
          code: 'SEDE_DUPLICADA',
          message: `Ya existe una sede con ese ${campo}.`,
        },
      });
    }

    const sede = this.sedeRepo.create({
      ...dto,
      nombre,
      codigo,
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

  /**
   * Actualiza campos de una sede existente.
   * Retorna la sede actualizada con ubicaciones.
   */
  async actualizarSede(id: number, dto: UpdateSedeDto): Promise<Sede> {
    const sede = await this.getSede(id);
    const nombre = dto.nombre?.trim() || sede.nombre;
    let codigo = dto.codigo?.trim();
    if (dto.codigo !== undefined && !codigo) {
      codigo = await this.generarCodigoSede(nombre);
    }

    const duplicada = await this.sedeRepo.findOne({
      where: [
        ...(dto.nombre !== undefined ? [{ nombre }] : []),
        ...(codigo !== undefined ? [{ codigo }] : []),
      ],
    });

    if (duplicada && duplicada.id !== id) {
      const campo = duplicada.nombre === nombre ? 'nombre' : 'codigo';
      throw new ConflictException({
        error: {
          code: 'SEDE_DUPLICADA',
          message: `Ya existe una sede con ese ${campo}.`,
        },
      });
    }

    Object.assign(sede, {
      ...dto,
      nombre,
      ...(codigo !== undefined ? { codigo } : {}),
    });
    await this.sedeRepo.save(sede);
    this.logger.log(`Sede actualizada: id=${id}`);
    return this.getSede(id);
  }

  private async generarCodigoSede(nombre: string): Promise<string> {
    const inicial = nombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);

    if (!inicial) {
      const count = await this.sedeRepo.count();
      return `SEDE-${String(count + 1).padStart(3, '0')}`;
    }

    let codigo = inicial;
    let contador = 1;
    let existe = await this.sedeRepo.findOne({ where: { codigo } });

    while (existe) {
      codigo = `${inicial}-${contador}`;
      contador++;
      existe = await this.sedeRepo.findOne({ where: { codigo } });
    }

    return codigo;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UBICACIONES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista las ubicaciones de una sede.
   * Equivalente a GET /config/sedes/{id}/ubicaciones en Python.
   */
  async listarUbicaciones(sedeId: number): Promise<Ubicacion[]> {
    await this.getSede(sedeId); // Valida que la sede existe → 404 si no

    return this.ubicacionRepo.find({
      where: { sedeId },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Crea una ubicación dentro de una sede.
   * Valida que la sede existe y que no haya nombre duplicado en la misma sede.
   */
  async crearUbicacion(dto: CreateUbicacionDto): Promise<Ubicacion> {
    await this.getSede(dto.sedeId); // 404 si la sede no existe

    const duplicada = await this.ubicacionRepo.findOne({
      where: { sedeId: dto.sedeId, nombre: dto.nombre },
    });

    if (duplicada) {
      throw new ConflictException({
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

  /**
   * Actualiza una ubicación.
   */
  async actualizarUbicacion(id: number, dto: UpdateUbicacionDto): Promise<Ubicacion> {
    const ubicacion = await this.ubicacionRepo.findOne({ where: { id } });

    if (!ubicacion) {
      throw new NotFoundException({
        error: { code: 'UBICACION_NO_ENCONTRADA', message: `Ubicación con id ${id} no encontrada.` },
      });
    }

    Object.assign(ubicacion, dto);
    const saved = await this.ubicacionRepo.save(ubicacion);
    this.logger.log(`Ubicación actualizada: id=${id}`);
    return saved;
  }

  /**
   * Elimina una ubicación (soft delete).
   */
  async eliminarUbicacion(id: number): Promise<void> {
    const ubicacion = await this.ubicacionRepo.findOne({ where: { id } });

    if (!ubicacion) {
      throw new NotFoundException({
        error: { code: 'UBICACION_NO_ENCONTRADA', message: `Ubicación con id ${id} no encontrada.` },
      });
    }

    await this.ubicacionRepo.softDelete(id);
    this.logger.log(`Ubicación eliminada (soft): id=${id}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CATÁLOGOS (EPS / ARL / AFP) — Patrón polimórfico
  // Evita duplicar 3 métodos CRUD idénticos usando un helper privado
  // que selecciona el repositorio según el tipo.
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna el repositorio correcto según el tipo de catálogo.
   * Patrón: Strategy ligero sin sobrecarga de clases.
   */
  private getCatalogoRepo(tipo: TipoCatalogo): Repository<CatEps | CatArl | CatAfp> {
    const repos: Record<TipoCatalogo, Repository<CatEps | CatArl | CatAfp>> = {
      eps: this.epsRepo as Repository<CatEps | CatArl | CatAfp>,
      arl: this.arlRepo as Repository<CatEps | CatArl | CatAfp>,
      afp: this.afpRepo as Repository<CatEps | CatArl | CatAfp>,
    };

    const repo = repos[tipo];
    if (!repo) {
      throw new BadRequestException({
        error: {
          code: 'CATALOGO_INVALIDO',
          message: `Tipo de catálogo '${tipo}' no válido. Use: eps, arl, afp.`,
        },
      });
    }

    return repo;
  }

  /**
   * Lista todos los items del catálogo indicado.
   * Equivalente a GET /config/catalogos/{tipo} en Python.
   */
  async listarCatalogo(tipo: TipoCatalogo): Promise<(CatEps | CatArl | CatAfp)[]> {
    const repo = this.getCatalogoRepo(tipo);
    return repo.find({ order: { nombre: 'ASC' } as any });
  }

  /**
   * Crea un item en el catálogo indicado.
   * Valida que el código no esté duplicado.
   */
  async crearItemCatalogo(
    tipo: TipoCatalogo,
    dto: CreateCatalogoDto,
  ): Promise<CatEps | CatArl | CatAfp> {
    const repo = this.getCatalogoRepo(tipo);

    const existente = await repo.findOne({ where: { codigo: dto.codigo } as any });
    if (existente) {
      throw new ConflictException({
        error: {
          code: 'CATALOGO_DUPLICADO',
          message: `Ya existe un item ${tipo.toUpperCase()} con el código '${dto.codigo}'.`,
        },
      });
    }

    const item = repo.create({ ...dto, activa: dto.activa ?? true } as any);
    const saved = await repo.save(item as any) as CatEps | CatArl | CatAfp;
    this.logger.log(`Catálogo ${tipo.toUpperCase()} creado: [${dto.codigo}] ${dto.nombre}`);
    return saved;
  }

  /**
   * Actualiza un item del catálogo.
   */
  async actualizarItemCatalogo(
    tipo: TipoCatalogo,
    id: number,
    dto: UpdateCatalogoDto,
  ): Promise<CatEps | CatArl | CatAfp> {
    const repo = this.getCatalogoRepo(tipo);
    const item = await repo.findOne({ where: { id } as any });

    if (!item) {
      throw new NotFoundException({
        error: {
          code: 'CATALOGO_NO_ENCONTRADO',
          message: `Item ${tipo.toUpperCase()} con id ${id} no encontrado.`,
        },
      });
    }

    Object.assign(item, dto);
    const saved = await repo.save(item as any) as CatEps | CatArl | CatAfp;
    this.logger.log(`Catálogo ${tipo.toUpperCase()} actualizado: id=${id}`);
    return saved;
  }

  /**
   * Elimina un item del catálogo (soft delete).
   */
  async eliminarItemCatalogo(tipo: TipoCatalogo, id: number): Promise<void> {
    const repo = this.getCatalogoRepo(tipo);
    const item = await repo.findOne({ where: { id } as any });

    if (!item) {
      throw new NotFoundException({
        error: {
          code: 'CATALOGO_NO_ENCONTRADO',
          message: `Item ${tipo.toUpperCase()} con id ${id} no encontrado.`,
        },
      });
    }

    await repo.softDelete(id);
    this.logger.log(`Catálogo ${tipo.toUpperCase()} eliminado (soft): id=${id}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NORMAS DE SEGURIDAD
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista normas de seguridad.
   * Si se pasa sedeId: retorna normas de esa sede + normas globales (sedeId IS NULL).
   * Sin sedeId: retorna todas las normas.
   *
   * Equivalente a GET /hse/catalogos/normas/{sedeId} en Python.
   */
  async listarNormas(sedeId?: number): Promise<CatNormaSeguridad[]> {
    if (sedeId !== undefined) {
      // Normas de la sede específica + normas globales
      return this.normaRepo
        .createQueryBuilder('n')
        .where('(n.sede_id = :sedeId OR n.sede_id IS NULL)', { sedeId })
        .andWhere('n.activa = true')
        .orderBy('n.numero', 'ASC')
        .getMany();
    }

    // Sin filtro: todas las normas (admin)
    return this.normaRepo.find({
      order: { numero: 'ASC' },
      relations: ['sede'],
    });
  }

  /**
   * Crea una norma de seguridad.
   * Si sedeId es null/undefined → norma global (aplica a todas las sedes).
   */
  async crearNorma(dto: CreateNormaDto): Promise<CatNormaSeguridad> {
    if (dto.sedeId !== undefined && dto.sedeId !== null) {
      await this.getSede(dto.sedeId); // Valida que la sede existe
    }

    const norma = this.normaRepo.create({
      ...dto,
      activa: dto.activa ?? true,
      sedeId: dto.sedeId ?? null,
    } as any);

    const saved = await this.normaRepo.save(norma) as unknown as CatNormaSeguridad;
    const scope = dto.sedeId ? `sede ${dto.sedeId}` : 'global';
    this.logger.log(`Norma creada: #${dto.numero} '${dto.titulo}' (${scope})`);
    return saved;
  }

  /**
   * Actualiza una norma de seguridad.
   */
  async actualizarNorma(id: number, dto: UpdateNormaDto): Promise<CatNormaSeguridad> {
    const norma = await this.normaRepo.findOne({
      where: { id },
      relations: ['sede'],
    });

    if (!norma) {
      throw new NotFoundException({
        error: { code: 'NORMA_NO_ENCONTRADA', message: `Norma con id ${id} no encontrada.` },
      });
    }

    if (dto.sedeId !== undefined && dto.sedeId !== null) {
      await this.getSede(dto.sedeId); // Valida que la nueva sede existe
    }

    Object.assign(norma, dto);
    const saved = await this.normaRepo.save(norma);
    this.logger.log(`Norma actualizada: id=${id}`);
    return this.normaRepo.findOne({ where: { id: saved.id }, relations: ['sede'] }) as Promise<CatNormaSeguridad>;
  }

  /**
   * Elimina una norma de seguridad (soft delete).
   */
  async eliminarNorma(id: number): Promise<void> {
    const norma = await this.normaRepo.findOne({ where: { id } });

    if (!norma) {
      throw new NotFoundException({
        error: { code: 'NORMA_NO_ENCONTRADA', message: `Norma con id ${id} no encontrada.` },
      });
    }

    await this.normaRepo.softDelete(id);
    this.logger.log(`Norma eliminada (soft): id=${id}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIEMPOS POR TIPO DE CONTRATISTA
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna la configuración de los 3 tipos de contratista.
   * Si alguno no existe en BD lo crea con valores por defecto antes de responder.
   */
  async listarTiemposContratista(): Promise<ConfigTiemposContratista[]> {
    await this.asegurarFilasDefecto();
    return this.tiemposRepo.find({
      order: { tipoContratista: 'ASC' },
    });
  }

  /**
   * Retorna la configuración de un tipo específico de contratista.
   * Útil para consumo interno (p.ej. AutorizacionService).
   */
  async getTiemposContratista(tipo: TipoContratistaConfig): Promise<ConfigTiemposContratista> {
    await this.asegurarFilaDefecto(tipo);
    const config = await this.tiemposRepo.findOne({ where: { tipoContratista: tipo } });
    return config!;
  }

  /**
   * Actualiza los parámetros de tiempo de un tipo de contratista.
   */
  async actualizarTiemposContratista(
    tipo: TipoContratistaConfig,
    dto: UpdateTiemposContratistaDto,
  ): Promise<ConfigTiemposContratista> {
    if (!Object.values(TipoContratistaConfig).includes(tipo)) {
      throw new BadRequestException({
        error: { code: 'TIPO_INVALIDO', message: `Tipo '${tipo}' no válido. Use: NORMAL, ALTO_RIESGO, EXCEPCION.` },
      });
    }

    await this.asegurarFilaDefecto(tipo);
    const config = await this.tiemposRepo.findOne({ where: { tipoContratista: tipo } });
    Object.assign(config!, dto);
    const saved = await this.tiemposRepo.save(config!);
    this.logger.log(`Tiempos contratista ${tipo} actualizados`);
    return saved;
  }

  private async asegurarFilasDefecto(): Promise<void> {
    for (const tipo of Object.values(TipoContratistaConfig)) {
      await this.asegurarFilaDefecto(tipo);
    }
  }

  private async asegurarFilaDefecto(tipo: TipoContratistaConfig): Promise<void> {
    const existe = await this.tiemposRepo.findOne({ where: { tipoContratista: tipo } });
    if (!existe) {
      const defaults = ConfigKoajService.TIEMPOS_DEFAULTS[tipo];
      await this.tiemposRepo.save(
        this.tiemposRepo.create({ tipoContratista: tipo, ...defaults }),
      );
      this.logger.log(`Fila por defecto creada para tipo contratista: ${tipo}`);
    }
  }
}
