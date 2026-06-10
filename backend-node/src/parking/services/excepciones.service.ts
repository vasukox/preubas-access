import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingExcepcion } from '../entities/parking-excepcion.entity'
import {
  CreateExcepcionDto, CreateExcepcionLoteDto, AnularExcepcionDto,
} from '../dto/excepcion.dto'

@Injectable()
export class ExcepcionesService {
  constructor(
    @InjectRepository(ParkingExcepcion)
    private readonly excepcionRepo: Repository<ParkingExcepcion>,
  ) {}

  private mapExcepcion(e: ParkingExcepcion) {
    return {
      id:              e.id,
      tipo_excepcion:  e.tipoExcepcion,
      alcance:         e.alcance,
      placa:           e.placa,
      nombre_persona:  e.nombrePersona,
      motivo:          e.motivo,
      fecha_inicio:    e.fechaInicio,
      fecha_fin:       e.fechaFin,
      horario_inicio:  e.horarioInicio,
      horario_fin:     e.horarioFin,
      usos_permitidos: e.usosPermitidos,
      usos_realizados: e.usosRealizados,
      activa:          e.activa,
      created_at:      e.created_at,
      sede: e.sede ? { id: e.sede.id, nombre: e.sede.nombre } : null,
      aprobador: e.aprobador ? {
        id:     e.aprobador.id,
        nombre: `${(e.aprobador as any).nombreCompleto ?? ''}`,
      } : null,
      zona: e.zona ? { id: e.zona.id, nombre: e.zona.nombre } : null,
    }
  }

  async findAll(params: {
    sedeId?: number; tipoExcepcion?: string; activa?: boolean;
    placa?: string; fechaDesde?: string; fechaHasta?: string;
    page?: number; perPage?: number
  }) {
    const page    = params.page    ?? 1
    const perPage = params.perPage ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.excepcionRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.sede',     'sede')
      .leftJoinAndSelect('e.aprobador','aprobador')
      .leftJoinAndSelect('e.zona',     'zona')
      .skip(skip).take(perPage)
      .orderBy('e.created_at', 'DESC')

    if (params.sedeId)     qb.andWhere('e.sedeId = :sid',        { sid: params.sedeId })
    if (params.tipoExcepcion) qb.andWhere('e.tipoExcepcion = :te', { te: params.tipoExcepcion })
    if (params.activa !== undefined) qb.andWhere('e.activa = :ac', { ac: params.activa })
    if (params.placa)       qb.andWhere('e.placa LIKE :p',        { p: `%${params.placa.toUpperCase()}%` })
    if (params.fechaDesde) qb.andWhere('e.fechaInicio >= :fd',   { fd: params.fechaDesde })
    if (params.fechaHasta) qb.andWhere('e.fechaFin <= :fh',      { fh: params.fechaHasta })

    const [items, total] = await qb.getManyAndCount()
    return {
      items: items.map(e => this.mapExcepcion(e)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findOne(id: number) {
    const e = await this.excepcionRepo.findOne({
      where: { id },
      relations: ['sede', 'aprobador', 'zona', 'persona'],
    })
    if (!e) throw new NotFoundException(`Excepción #${id} no encontrada`)
    return this.mapExcepcion(e)
  }

  async create(dto: CreateExcepcionDto, usuarioId: number) {
    const excepcion = this.excepcionRepo.create({
      sedeId:       dto.sedeId,
      tipoExcepcion: dto.tipoExcepcion,
      alcance:      dto.alcance,
      placa:        dto.placa?.toUpperCase()  ?? null,
      personaId:    dto.personaId            ?? null,
      nombrePersona: dto.nombrePersona       ?? null,
      motivo:       dto.motivo,
      aprobadoPor:  usuarioId,
      fechaInicio:  new Date(dto.fechaInicio),
      fechaFin:     new Date(dto.fechaFin),
      horarioInicio: dto.horarioInicio       ?? null,
      horarioFin:   dto.horarioFin           ?? null,
      zonaId:       dto.zonaId               ?? null,
      usosPermitidos: dto.usosPermitidos     ?? null,
      usosRealizados: 0,
      activa:       true,
    })
    await this.excepcionRepo.save(excepcion)
    return this.findOne(excepcion.id)
  }

  async crearLote(dto: CreateExcepcionLoteDto, usuarioId: number): Promise<{ creadas: number; ids: number[] }> {
    const excepciones = dto.placas.map(placa =>
      this.excepcionRepo.create({
        sedeId:       dto.sedeId,
        tipoExcepcion: dto.tipoExcepcion,
        alcance:      dto.alcance,
        placa:        placa.toUpperCase(),
        motivo:       dto.motivo,
        aprobadoPor:  usuarioId,
        fechaInicio:  new Date(dto.fechaInicio),
        fechaFin:     new Date(dto.fechaFin),
        horarioInicio: dto.horarioInicio ?? null,
        horarioFin:   dto.horarioFin     ?? null,
        usosPermitidos: null,
        usosRealizados: 0,
        activa:       true,
      })
    )
    const guardadas = await this.excepcionRepo.save(excepciones)
    return { creadas: guardadas.length, ids: guardadas.map(e => e.id) }
  }

  async activar(id: number) {
    const e = await this.excepcionRepo.findOne({ where: { id } })
    if (!e) throw new NotFoundException(`Excepción #${id} no encontrada`)
    e.activa = true
    await this.excepcionRepo.save(e)
    return this.findOne(id)
  }

  async desactivar(id: number) {
    const e = await this.excepcionRepo.findOne({ where: { id } })
    if (!e) throw new NotFoundException(`Excepción #${id} no encontrada`)
    e.activa = false
    await this.excepcionRepo.save(e)
    return this.findOne(id)
  }

  async anular(id: number, dto: AnularExcepcionDto) {
    const e = await this.excepcionRepo.findOne({ where: { id } })
    if (!e) throw new NotFoundException(`Excepción #${id} no encontrada`)
    e.activa = false
    await this.excepcionRepo.save(e)
    await this.excepcionRepo.softRemove(e)
    return { message: `Excepción #${id} anulada: ${dto.motivo}` }
  }
}
