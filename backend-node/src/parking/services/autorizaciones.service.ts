import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { ParkingHistorial }    from '../entities/parking-historial.entity'
import { ParkingCupo }         from '../entities/parking-cupo.entity'
import { EstadoAutorizacionParking, EstadoCupo } from '../../common/enums/parking.enum'

@Injectable()
export class AutorizacionesService {
  constructor(
    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,

    @InjectRepository(ParkingHistorial)
    private readonly historialRepo: Repository<ParkingHistorial>,

    @InjectRepository(ParkingCupo)
    private readonly cupoRepo: Repository<ParkingCupo>,
  ) {}

  private mapAutorizacion(a: ParkingAutorizacion) {
    return {
      id:               a.id,
      tipo_autorizacion: a.tipoAutorizacion,
      estado:            a.estado,
      fecha_inicio:      a.fechaInicio,
      fecha_fin:         a.fechaFin,
      dias_permitidos:   a.diasPermitidos ? JSON.parse(a.diasPermitidos) : null,
      horario_inicio:    a.horarioInicio,
      horario_fin:       a.horarioFin,
      observaciones:     a.observaciones,
      vehiculo: a.vehiculo ? {
        id:           a.vehiculo.id,
        placa:        a.vehiculo.placa,
        tipo_vehiculo: a.vehiculo.tipoVehiculo,
        marca:        a.vehiculo.marca,
        linea:        a.vehiculo.linea,
      } : null,
      persona: a.persona ? {
        id:       a.persona.id,
        nombres:  (a.persona as any).nombres,
        apellidos: (a.persona as any).apellidos,
      } : null,
      cupo: a.cupo ? {
        id:          a.cupo.id,
        numero_cupo: a.cupo.numeroCupo,
        tipo_cupo:   a.cupo.tipoCupo,
        estado:      a.cupo.estado,
        zona: a.cupo.zona ? { id: a.cupo.zona.id, nombre: a.cupo.zona.nombre } : null,
      } : null,
      solicitud: a.solicitud ? { id: a.solicitud.id, codigo: a.solicitud.codigo } : null,
    }
  }

  async findAll(params: {
    sede_id?: number; estado?: string; tipo_autorizacion?: string;
    placa?: string; persona_id?: number; page?: number; per_page?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.per_page ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.autorizacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.vehiculo', 'v')
      .leftJoinAndSelect('a.persona',  'p')
      .leftJoinAndSelect('a.cupo',     'c')
      .leftJoinAndSelect('c.zona',     'z')
      .leftJoinAndSelect('a.solicitud','s')
      .skip(skip).take(perPage)
      .orderBy('a.created_at', 'DESC')

    if (params.sede_id)          qb.andWhere('a.sedeId = :sid',  { sid: params.sede_id })
    if (params.estado)           qb.andWhere('a.estado = :e',    { e: params.estado })
    if (params.tipo_autorizacion) qb.andWhere('a.tipoAutorizacion = :ta', { ta: params.tipo_autorizacion })
    if (params.placa)            qb.andWhere('v.placa LIKE :p',  { p: `%${params.placa.toUpperCase()}%` })
    if (params.persona_id)       qb.andWhere('a.personaId = :pid', { pid: params.persona_id })

    const [items, total] = await qb.getManyAndCount()

    return {
      items: items.map(a => this.mapAutorizacion(a)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findOne(id: number) {
    const a = await this.autorizacionRepo.findOne({
      where: { id },
      relations: ['vehiculo', 'persona', 'cupo', 'cupo.zona', 'solicitud', 'aprobador'],
    })
    if (!a) throw new NotFoundException(`Autorización #${id} no encontrada`)
    return this.mapAutorizacion(a)
  }

  async asignarCupo(id: number, cupoId: number | null, usuarioId: number) {
    const a = await this.autorizacionRepo.findOne({ where: { id }, relations: ['vehiculo'] })
    if (!a) throw new NotFoundException(`Autorización #${id} no encontrada`)

    if (cupoId) {
      const cupo = await this.cupoRepo.findOne({ where: { id: cupoId }, relations: ['zona'] })
      if (!cupo) throw new NotFoundException(`Cupo #${cupoId} no encontrado`)
      if (cupo.estado !== EstadoCupo.DISPONIBLE && cupo.estado !== EstadoCupo.ASIGNADO) {
        throw new BadRequestException(`El cupo está en estado ${cupo.estado} y no puede asignarse`)
      }
      // Liberar cupo anterior si existe
      if (a.cupoId && a.cupoId !== cupoId) {
        await this.cupoRepo.update(a.cupoId, { estado: EstadoCupo.DISPONIBLE })
      }
      await this.cupoRepo.update(cupoId, { estado: EstadoCupo.ASIGNADO })
      a.cupoId = cupoId
    } else {
      // Quitar cupo
      if (a.cupoId) {
        await this.cupoRepo.update(a.cupoId, { estado: EstadoCupo.DISPONIBLE })
      }
      a.cupoId = null
    }

    await this.autorizacionRepo.save(a)
    await this.historialRepo.save(this.historialRepo.create({
      autorizacionId: id, usuarioId,
      evento: 'CUPO_ASIGNADO', descripcion: cupoId ? `Cupo #${cupoId} asignado` : 'Cupo desasignado',
      estadoAnterior: null, estadoNuevo: null, fechaHora: new Date(),
    }))

    return this.findOne(id)
  }

  async suspender(id: number, motivo: string, usuarioId: number) {
    const a = await this.autorizacionRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Autorización #${id} no encontrada`)

    if (a.estado !== EstadoAutorizacionParking.ACTIVA) {
      throw new BadRequestException(`Solo se pueden suspender autorizaciones ACTIVAS (estado: ${a.estado})`)
    }

    a.estado = EstadoAutorizacionParking.SUSPENDIDA
    await this.autorizacionRepo.save(a)
    await this.historialRepo.save(this.historialRepo.create({
      autorizacionId: id, usuarioId,
      evento: 'SUSPENDIDA', descripcion: motivo,
      estadoAnterior: EstadoAutorizacionParking.ACTIVA, estadoNuevo: EstadoAutorizacionParking.SUSPENDIDA,
      fechaHora: new Date(),
    }))

    return this.findOne(id)
  }

  async reactivar(id: number, motivo: string, usuarioId: number) {
    const a = await this.autorizacionRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Autorización #${id} no encontrada`)

    if (a.estado !== EstadoAutorizacionParking.SUSPENDIDA) {
      throw new BadRequestException(`Solo se pueden reactivar autorizaciones SUSPENDIDAS (estado: ${a.estado})`)
    }

    const ahora = new Date()
    if (a.fechaFin < ahora) {
      throw new BadRequestException('No se puede reactivar: la autorización ya está vencida por fecha')
    }

    a.estado = EstadoAutorizacionParking.ACTIVA
    await this.autorizacionRepo.save(a)
    await this.historialRepo.save(this.historialRepo.create({
      autorizacionId: id, usuarioId,
      evento: 'REACTIVADA', descripcion: motivo,
      estadoAnterior: EstadoAutorizacionParking.SUSPENDIDA, estadoNuevo: EstadoAutorizacionParking.ACTIVA,
      fechaHora: new Date(),
    }))

    return this.findOne(id)
  }

  async revocar(id: number, motivo: string, usuarioId: number) {
    const a = await this.autorizacionRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Autorización #${id} no encontrada`)

    const estadoAnterior = a.estado
    a.estado = EstadoAutorizacionParking.REVOCADA
    await this.autorizacionRepo.save(a)
    await this.historialRepo.save(this.historialRepo.create({
      autorizacionId: id, usuarioId,
      evento: 'REVOCADA', descripcion: motivo,
      estadoAnterior, estadoNuevo: EstadoAutorizacionParking.REVOCADA,
      fechaHora: new Date(),
    }))

    return this.findOne(id)
  }
}
