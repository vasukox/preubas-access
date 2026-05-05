import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GhCita } from './entities/gh-cita.entity';

@Injectable()
export class GhService {
  constructor(
    @InjectRepository(GhCita)
    private readonly citaRepo: Repository<GhCita>,
  ) {}

  async getCitas(
    sedeId: number,
    estado?: string,
    tipoCita?: string,
    busqueda?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    page = 1,
    perPage = 20
  ): Promise<GhCita[]> {
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
      query.andWhere(
        '(persona.nombres LIKE :busqueda OR persona.apellidos LIKE :busqueda OR persona.numeroIdentificacion LIKE :busqueda)', 
        { busqueda: `%${busqueda}%` }
      );
    }

    const items = await query
      .orderBy('c.fechaInicio', 'DESC')
      .skip(skip)
      .take(perPage)
      .getMany();

    return items;
  }
}
