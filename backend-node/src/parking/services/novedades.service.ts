import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingNovedad } from '../entities/parking-novedad.entity'
import { EstadoNovedad }  from '../../common/enums/parking.enum'
import {
  CreateNovedadDto, UpdateNovedadDto, EscalarNovedadDto,
  CerrarNovedadDto, AnularNovedadDto,
} from '../dto/novedad.dto'

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(ParkingNovedad)
    private readonly novedadRepo: Repository<ParkingNovedad>,
  ) {}

  private mapNovedad(n: ParkingNovedad) {
    return {
      id:              n.id,
      tipo_novedad:    n.tipoNovedad,
      descripcion:     n.descripcion,
      placa:           n.placa,
      estado:          n.estado,
      accion_tomada:   n.accionTomada,
      observacion_resolucion: n.observacionResolucion,
      resuelta_en:     n.resueltaEn,
      created_at:      n.created_at,
      sede: n.sede ? { id: n.sede.id, nombre: n.sede.nombre } : null,
      reportador: n.reportador ? {
        id:     n.reportador.id,
        nombre: `${(n.reportador as any).nombreCompleto ?? ''}`,
      } : null,
      asignado: n.asignado ? {
        id:     n.asignado.id,
        nombre: `${(n.asignado as any).nombreCompleto ?? ''}`,
      } : null,
      resolutor: n.resolutor ? {
        id:     n.resolutor.id,
        nombre: `${(n.resolutor as any).nombreCompleto ?? ''}`,
      } : null,
    }
  }

  async findAll(params: {
    sedeId?: number; estado?: string; tipoNovedad?: string;
    placa?: string; fechaDesde?: string; fechaHasta?: string;
    page?: number; perPage?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.perPage ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.novedadRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.sede',      'sede')
      .leftJoinAndSelect('n.reportador','rep')
      .leftJoinAndSelect('n.asignado',  'asig')
      .leftJoinAndSelect('n.resolutor', 'res')
      .skip(skip).take(perPage)
      .orderBy('n.created_at', 'DESC')

    if (params.sedeId)    qb.andWhere('n.sedeId = :sid',       { sid: params.sedeId })
    if (params.estado)     qb.andWhere('n.estado = :e',         { e: params.estado })
    if (params.tipoNovedad) qb.andWhere('n.tipoNovedad = :tn', { tn: params.tipoNovedad })
    if (params.placa)      qb.andWhere('n.placa LIKE :p',       { p: `%${params.placa.toUpperCase()}%` })
    if (params.fechaDesde) qb.andWhere('n.created_at >= :fd',  { fd: params.fechaDesde })
    if (params.fechaHasta) qb.andWhere('n.created_at <= :fh',  { fh: params.fechaHasta })

    const [items, total] = await qb.getManyAndCount()
    return {
      items: items.map(n => this.mapNovedad(n)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findOne(id: number) {
    const n = await this.novedadRepo.findOne({
      where: { id },
      relations: ['sede', 'reportador', 'asignado', 'resolutor', 'acceso', 'autorizacion', 'persona'],
    })
    if (!n) throw new NotFoundException(`Novedad #${id} no encontrada`)
    return this.mapNovedad(n)
  }

  async create(dto: CreateNovedadDto, usuarioId: number) {
    const novedad = this.novedadRepo.create({
      sedeId:        dto.sedeId,
      tipoNovedad:   dto.tipoNovedad,
      descripcion:   dto.descripcion,
      placa:         dto.placa?.toUpperCase() ?? null,
      autorizacionId: dto.autorizacionId ?? null,
      accesoId:      dto.accesoId       ?? null,
      personaId:     dto.personaId      ?? null,
      reportadoPor:  usuarioId,
      estado:        EstadoNovedad.ABIERTA,
    })
    await this.novedadRepo.save(novedad)
    return this.findOne(novedad.id)
  }

  async update(id: number, dto: UpdateNovedadDto) {
    const n = await this.novedadRepo.findOne({ where: { id } })
    if (!n) throw new NotFoundException(`Novedad #${id} no encontrada`)

    if (dto.descripcion)  n.descripcion  = dto.descripcion
    if (dto.accionTomada) n.accionTomada = dto.accionTomada
    if (dto.asignadoA !== undefined) n.asignadoA = dto.asignadoA ?? null

    // Actualizar estado según asignación
    if (dto.asignadoA && n.estado === EstadoNovedad.ABIERTA) {
      n.estado = EstadoNovedad.EN_REVISION
    }

    await this.novedadRepo.save(n)
    return this.findOne(id)
  }

  async escalar(id: number, dto: EscalarNovedadDto) {
    const n = await this.novedadRepo.findOne({ where: { id } })
    if (!n) throw new NotFoundException(`Novedad #${id} no encontrada`)

    const estadosPermitidos = [EstadoNovedad.ABIERTA, EstadoNovedad.EN_REVISION]
    if (!estadosPermitidos.includes(n.estado)) {
      throw new BadRequestException(`No se puede escalar una novedad en estado ${n.estado}`)
    }

    n.estado       = EstadoNovedad.ESCALADA
    n.accionTomada = dto.observacion
    await this.novedadRepo.save(n)
    return this.findOne(id)
  }

  async cerrar(id: number, dto: CerrarNovedadDto, usuarioId: number) {
    const n = await this.novedadRepo.findOne({ where: { id } })
    if (!n) throw new NotFoundException(`Novedad #${id} no encontrada`)

    if (n.estado === EstadoNovedad.CERRADA || n.estado === EstadoNovedad.ANULADA) {
      throw new BadRequestException(`La novedad ya está ${n.estado.toLowerCase()}`)
    }

    n.estado               = EstadoNovedad.CERRADA
    n.observacionResolucion = dto.observacionResolucion
    n.resueltoPor          = usuarioId
    n.resueltaEn           = new Date()
    await this.novedadRepo.save(n)
    return this.findOne(id)
  }

  async anular(id: number, dto: AnularNovedadDto) {
    const n = await this.novedadRepo.findOne({ where: { id } })
    if (!n) throw new NotFoundException(`Novedad #${id} no encontrada`)

    if (n.estado === EstadoNovedad.CERRADA || n.estado === EstadoNovedad.ANULADA) {
      throw new BadRequestException(`La novedad ya está ${n.estado.toLowerCase()}`)
    }

    n.estado               = EstadoNovedad.ANULADA
    n.observacionResolucion = dto.observacion
    await this.novedadRepo.save(n)
    return this.findOne(id)
  }
}
