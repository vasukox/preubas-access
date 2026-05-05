import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sede } from '../sede/entities/sede.entity';
import { CatEps } from './entities/cat-eps.entity';
import { HseAutorizacion } from './entities/hse-autorizacion.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { EstadoAutorizacion } from '../common/enums/hse.enum';

@Injectable()
export class HseService {
  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepo: Repository<Sede>,
    @InjectRepository(CatEps)
    private readonly epsRepo: Repository<CatEps>,
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
  ) {}

  async getCatalogosSedes(usuario: any): Promise<Sede[]> {
    // ADMIN_GLOBAL y ADMIN_HSE ven todas. Otros ven su sede asignada.
    const roles = usuario.roles || [];
    if (roles.includes('ADMIN_GLOBAL') || roles.includes('ADMIN_HSE')) {
      return this.sedeRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
    }
    if (usuario.sedeAsignadaId) {
      return this.sedeRepo.find({ where: { id: usuario.sedeAsignadaId, activa: true } });
    }
    return [];
  }

  async getCatalogosEps(): Promise<CatEps[]> {
    return this.epsRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  async getAutorizaciones(sedeId: number, estado?: string, page = 1, perPage = 20): Promise<any> {
    const skip = (page - 1) * perPage;
    const whereClause: any = { sedeId };
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

    // Map to expected format
    return {
      items: items,
      total: total
    };
  }

  async getDashboard(sedeId: number): Promise<any> {
    const total = await this.autorizacionRepo.count({ where: { sedeId } });
    const activas = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.APROBADO } });
    const pendientes = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.EN_REVISION } });
    const vencidas = await this.autorizacionRepo.count({ where: { sedeId, estado: EstadoAutorizacion.VENCIDO } });

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
}
