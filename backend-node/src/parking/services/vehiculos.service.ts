import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingVehiculo }    from '../entities/parking-vehiculo.entity'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { EstadoAutorizacionParking } from '../../common/enums/parking.enum'

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(ParkingVehiculo)
    private readonly vehiculoRepo: Repository<ParkingVehiculo>,

    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,
  ) {}

  private mapVehiculo(v: ParkingVehiculo, autorizacionActiva?: ParkingAutorizacion | null) {
    return {
      id:            v.id,
      placa:         v.placa,
      marca:         v.marca,
      linea:         v.linea,
      color:         v.color,
      modelo_anio:   v.modeloAnio,
      tipo_vehiculo: v.tipoVehiculo,
      es_electrico:  v.esElectrico,
      es_vehiculo_empresa: v.esVehiculoEmpresa,
      activo:        v.activo,
      sede: v.sede ? { id: v.sede.id, nombre: v.sede.nombre } : null,
      persona: v.persona ? {
        id: v.persona.id,
        nombres: (v.persona as any).nombres,
        apellidos: (v.persona as any).apellidos,
      } : null,
      autorizacion_activa: autorizacionActiva ? {
        id:        autorizacionActiva.id,
        estado:    autorizacionActiva.estado,
        fecha_fin: autorizacionActiva.fechaFin,
      } : null,
    }
  }

  async findAll(params: {
    sede_id?: number; tipo_vehiculo?: string; activo?: boolean;
    placa?: string; page?: number; per_page?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.per_page ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.vehiculoRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.sede',   'sede')
      .leftJoinAndSelect('v.persona','persona')
      .skip(skip).take(perPage)
      .orderBy('v.created_at', 'DESC')

    if (params.sede_id)     qb.andWhere('v.sedeId = :sid',         { sid: params.sede_id })
    if (params.tipo_vehiculo) qb.andWhere('v.tipoVehiculo = :tv',  { tv: params.tipo_vehiculo })
    if (params.activo !== undefined) qb.andWhere('v.activo = :ac', { ac: params.activo })
    if (params.placa)       qb.andWhere('v.placa LIKE :p',         { p: `%${params.placa.toUpperCase()}%` })

    const [vehiculos, total] = await qb.getManyAndCount()

    // Obtener autorizaciones activas en lote para evitar N+1
    const vehiculoIds = vehiculos.map(v => v.id)
    const autorizaciones = vehiculoIds.length > 0
      ? await this.autorizacionRepo.find({
          where: { vehiculoId: vehiculoIds.length === 1 ? vehiculoIds[0] : undefined, estado: EstadoAutorizacionParking.ACTIVA },
          ...(vehiculoIds.length > 1 && { where: [{ estado: EstadoAutorizacionParking.ACTIVA }] }),
        })
      : []

    const autorizacionMap = new Map(autorizaciones.map(a => [a.vehiculoId, a]))

    return {
      items: vehiculos.map(v => this.mapVehiculo(v, autorizacionMap.get(v.id) ?? null)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findOne(id: number) {
    const v = await this.vehiculoRepo.findOne({
      where: { id },
      relations: ['sede', 'persona'],
    })
    if (!v) throw new NotFoundException(`Vehículo #${id} no encontrado`)

    const autorizacionActiva = await this.autorizacionRepo.findOne({
      where: { vehiculoId: id, estado: EstadoAutorizacionParking.ACTIVA },
    })

    return this.mapVehiculo(v, autorizacionActiva)
  }

  async cambiarEstado(id: number, activo: boolean) {
    const v = await this.vehiculoRepo.findOne({ where: { id } })
    if (!v) throw new NotFoundException(`Vehículo #${id} no encontrado`)

    v.activo = activo
    await this.vehiculoRepo.save(v)
    return this.findOne(id)
  }
}
