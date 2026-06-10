import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingAcceso } from '../entities/parking-acceso.entity'

@Injectable()
export class AccesosService {
  constructor(
    @InjectRepository(ParkingAcceso)
    private readonly accesoRepo: Repository<ParkingAcceso>,
  ) {}

  private mapAcceso(a: ParkingAcceso) {
    return {
      id:           a.id,
      placa:        a.placa,
      tipo_vehiculo: a.tipoVehiculo,
      tipo_acceso:  a.tipoAcceso,
      resultado:    a.resultado,
      metodo:       a.metodo,
      observacion:  a.observacion,
      fecha_hora:   a.fechaHora,
      registrador: a.registrador ? {
        nombre: `${(a.registrador as any).nombreCompleto ?? ''}`,
      } : null,
      cupo: a.cupo ? {
        id:          a.cupo.id,
        numero_cupo: a.cupo.numeroCupo,
        zona: a.cupo.zona ? { nombre: a.cupo.zona.nombre } : null,
      } : null,
    }
  }

  async findAll(params: {
    sede_id?: number; placa?: string; tipo_acceso?: string;
    resultado?: string; fecha_desde?: string; fecha_hasta?: string;
    page?: number; per_page?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.per_page ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.accesoRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.registrador', 'reg')
      .leftJoinAndSelect('a.cupo',        'c')
      .leftJoinAndSelect('c.zona',        'z')
      .skip(skip).take(perPage)
      .orderBy('a.fechaHora', 'DESC')

    if (params.sede_id)    qb.andWhere('a.sedeId = :sid',       { sid: params.sede_id })
    if (params.placa)      qb.andWhere('a.placa LIKE :p',       { p: `%${params.placa.toUpperCase()}%` })
    if (params.tipo_acceso) qb.andWhere('a.tipoAcceso = :ta',   { ta: params.tipo_acceso })
    if (params.resultado)  qb.andWhere('a.resultado = :r',      { r: params.resultado })
    if (params.fecha_desde) qb.andWhere('a.fechaHora >= :fd',   { fd: params.fecha_desde })
    if (params.fecha_hasta) qb.andWhere('a.fechaHora <= :fh',   { fh: params.fecha_hasta })

    const [items, total] = await qb.getManyAndCount()
    return {
      items: items.map(a => this.mapAcceso(a)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findByVehiculo(placa: string, params: {
    sede_id?: number; fecha_desde?: string; fecha_hasta?: string;
    page?: number; per_page?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.per_page ?? 20
    const skip    = (page - 1) * perPage
    const placaNorm = placa.toUpperCase().replace(/[^A-Z0-9]/g, '')

    const qb = this.accesoRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.registrador', 'reg')
      .leftJoinAndSelect('a.cupo',        'c')
      .where('a.placa = :placa', { placa: placaNorm })
      .skip(skip).take(perPage)
      .orderBy('a.fechaHora', 'DESC')

    if (params.sede_id)    qb.andWhere('a.sedeId = :sid',     { sid: params.sede_id })
    if (params.fecha_desde) qb.andWhere('a.fechaHora >= :fd', { fd: params.fecha_desde })
    if (params.fecha_hasta) qb.andWhere('a.fechaHora <= :fh', { fh: params.fecha_hasta })

    const [items, total] = await qb.getManyAndCount()
    return {
      placa: placaNorm,
      items: items.map(a => this.mapAcceso(a)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }
}
