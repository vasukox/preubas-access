import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Sede } from '../sede/entities/sede.entity';
import { CatEps } from './entities/cat-eps.entity';
import { CatArl } from './entities/cat-arl.entity';
import { CatAfp } from './entities/cat-afp.entity';
import { CatNormaSeguridad } from './entities/cat-norma-seguridad.entity';
import { HseAutorizacion } from './entities/hse-autorizacion.entity';
import { HseContratista } from './entities/hse-contratista.entity';
import { HseAcceso } from './entities/hse-acceso.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { EstadoAutorizacion, EstadoContratista, TipoContratista } from '../common/enums/hse.enum';
import { AccesoService } from './services/acceso.service';

@Injectable()
export class HseService {
  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepo: Repository<Sede>,
    @InjectRepository(CatEps)
    private readonly epsRepo: Repository<CatEps>,
    @InjectRepository(CatArl)
    private readonly arlRepo: Repository<CatArl>,
    @InjectRepository(CatAfp)
    private readonly afpRepo: Repository<CatAfp>,
    @InjectRepository(CatNormaSeguridad)
    private readonly normaRepo: Repository<CatNormaSeguridad>,
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseAcceso)
    private readonly accesoRepo: Repository<HseAcceso>,
    private readonly accesoService: AccesoService,
  ) {}

  async getCatalogosSedes(usuario: any): Promise<Sede[]> {
    // Endpoint público: siempre retorna todas las sedes activas.
    // El guard JwtAuthGuard salta el procesamiento en rutas @Public(), por lo que
    // req.user no se popula aunque el cliente envíe token. Filtrar por rol/sede
    // aquí no es posible, y tampoco es necesario para un catálogo de solo lectura.
    return this.sedeRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  async getCatalogosEps(): Promise<CatEps[]> {
    return this.epsRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  async getCatalogosArl(): Promise<CatArl[]> {
    return this.arlRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  async getCatalogosAfp(): Promise<CatAfp[]> {
    return this.afpRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  async getCatalogosNormas(sedeId: number): Promise<CatNormaSeguridad[]> {
    return this.normaRepo.find({
      where: [
        { activa: true, sedeId: sedeId },
        { activa: true, sedeId: IsNull() }
      ],
      order: { numero: 'ASC' }
    });
  }

  async getDashboard(sedeId: number): Promise<any> {
    const total = await this.autorizacionRepo.count({ where: { sedeId } });
    const activas = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.APROBADO } });
    const pendientes = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.EN_REVISION } });
    const vencidas = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.VENCIDO } });

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
      .andWhere('contratista.estado = :estado', { estado: EstadoContratista.APROBADO })
      .select(['contratista.id AS id', 'autorizacion.tipo_contratista AS tipoContratista'])
      .getRawMany();

    const altoRiesgoActivos = contratistasActivos.filter(
      (row) => row.tipoContratista === TipoContratista.ALTO_RIESGO,
    ).length;
    const normalActivos = contratistasActivos.filter(
      (row) => row.tipoContratista === TipoContratista.NORMAL,
    ).length;

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
}
