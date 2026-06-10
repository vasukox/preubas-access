import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingZona }  from '../entities/parking-zona.entity'
import { ParkingCupo }  from '../entities/parking-cupo.entity'
import { ParkingAcceso } from '../entities/parking-acceso.entity'
import { EstadoCupo }   from '../../common/enums/parking.enum'
import {
  CreateZonaDto, UpdateZonaDto, CreateCupoDto, CambiarEstadoCupoDto, ListarCuposDto,
} from '../dto/zona.dto'

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(ParkingZona)
    private readonly zonaRepo: Repository<ParkingZona>,

    @InjectRepository(ParkingCupo)
    private readonly cupoRepo: Repository<ParkingCupo>,

    @InjectRepository(ParkingAcceso)
    private readonly accesoRepo: Repository<ParkingAcceso>,
  ) {}

  private mapZona(z: ParkingZona, ocupados = 0) {
    const disponibles = z.capacidadTotal - ocupados
    const asignados   = 0
    return {
      id:             z.id,
      nombre:         z.nombre,
      descripcion:    z.descripcion,
      sede_id:        z.sedeId,
      capacidad_total: z.capacidadTotal,
      capacidad_carros: z.capacidadCarros,
      capacidad_motos:  z.capacidadMotos,
      capacidad_bicis:  z.capacidadBicis,
      capacidad_electricos: z.capacidadElectricos,
      capacidad_visitantes: z.capacidadVisitantes,
      activa:         z.activa,
      ocupacion: {
        total:        z.capacidadTotal,
        disponibles:  Math.max(0, disponibles),
        asignados,
        ocupados,
        bloqueados:   0,
        porcentaje_ocupacion: z.capacidadTotal > 0 ? Math.round((ocupados / z.capacidadTotal) * 100) : 0,
      },
    }
  }

  async findAll(sedeId?: number, activa?: boolean) {
    const where: Record<string, unknown> = {}
    if (sedeId !== undefined) where['sedeId'] = sedeId
    if (activa !== undefined) where['activa'] = activa

    const zonas = await this.zonaRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: ['cupos'],
      order: { nombre: 'ASC' },
    })

    // Calcular ocupados reales por zona (cupos en estado OCUPADO)
    return zonas.map(z => {
      const ocupados = (z.cupos ?? []).filter(c => c.estado === EstadoCupo.OCUPADO).length
      return this.mapZona(z, ocupados)
    })
  }

  async findOne(id: number) {
    const z = await this.zonaRepo.findOne({ where: { id }, relations: ['cupos'] })
    if (!z) throw new NotFoundException(`Zona #${id} no encontrada`)
    const ocupados = (z.cupos ?? []).filter(c => c.estado === EstadoCupo.OCUPADO).length
    return this.mapZona(z, ocupados)
  }

  async create(dto: CreateZonaDto) {
    const zona = this.zonaRepo.create({
      sedeId:                  dto.sedeId,
      nombre:                  dto.nombre,
      descripcion:             dto.descripcion ?? null,
      capacidadTotal:          dto.capacidadTotal,
      capacidadCarros:         dto.capacidadCarros  ?? 0,
      capacidadMotos:          dto.capacidadMotos   ?? 0,
      capacidadBicis:          dto.capacidadBicis   ?? 0,
      capacidadElectricos:     dto.capacidadElectricos ?? 0,
      capacidadVisitantes:     dto.capacidadVisitantes ?? 0,
      capacidadMovilidadReducida: dto.capacidadMovilidadReducida ?? 0,
      activa:                  true,
    })
    await this.zonaRepo.save(zona)
    return this.findOne(zona.id)
  }

  async update(id: number, dto: UpdateZonaDto) {
    const z = await this.zonaRepo.findOne({ where: { id } })
    if (!z) throw new NotFoundException(`Zona #${id} no encontrada`)

    if (dto.nombre)               z.nombre          = dto.nombre
    if (dto.descripcion !== undefined) z.descripcion = dto.descripcion ?? null
    if (dto.capacidadTotal)      z.capacidadTotal   = dto.capacidadTotal
    if (dto.capacidadCarros  !== undefined) z.capacidadCarros  = dto.capacidadCarros  ?? 0
    if (dto.capacidadMotos   !== undefined) z.capacidadMotos   = dto.capacidadMotos   ?? 0
    if (dto.capacidadBicis   !== undefined) z.capacidadBicis   = dto.capacidadBicis   ?? 0
    if (dto.capacidadElectricos !== undefined) z.capacidadElectricos = dto.capacidadElectricos ?? 0
    if (dto.capacidadVisitantes !== undefined) z.capacidadVisitantes = dto.capacidadVisitantes ?? 0

    await this.zonaRepo.save(z)
    return this.findOne(id)
  }

  // ── Cupos ──────────────────────────────────────────────────────

  private mapCupo(c: ParkingCupo) {
    return {
      id:          c.id,
      zona_id:     c.zonaId,
      sede_id:     c.sedeId,
      numero_cupo: c.numeroCupo,
      tipo_cupo:   c.tipoCupo,
      estado:      c.estado,
      observacion: c.observacion,
      zona: c.zona ? { id: c.zona.id, nombre: c.zona.nombre } : null,
    }
  }

  async findAllCupos(dto: ListarCuposDto) {
    const page    = dto.page    ?? 1
    const perPage = dto.perPage ?? 50
    const skip    = (page - 1) * perPage

    const qb = this.cupoRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.zona', 'z')
      .skip(skip).take(perPage)
      .orderBy('c.numeroCupo', 'ASC')

    if (dto.zonaId)   qb.andWhere('c.zonaId = :zid',    { zid: dto.zonaId })
    if (dto.sedeId)   qb.andWhere('c.sedeId = :sid',    { sid: dto.sedeId })
    if (dto.tipoCupo) qb.andWhere('c.tipoCupo = :tc',   { tc: dto.tipoCupo })
    if (dto.estado)    qb.andWhere('c.estado = :e',      { e: dto.estado })

    const [items, total] = await qb.getManyAndCount()
    return {
      items: items.map(c => this.mapCupo(c)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async createCupo(dto: CreateCupoDto) {
    const zona = await this.zonaRepo.findOne({ where: { id: dto.zonaId } })
    if (!zona) throw new NotFoundException(`Zona #${dto.zonaId} no encontrada`)

    // Verificar que el número de cupo no exista en la misma zona
    const existe = await this.cupoRepo.findOne({
      where: { zonaId: dto.zonaId, numeroCupo: dto.numeroCupo },
    })
    if (existe) throw new BadRequestException(`El cupo "${dto.numeroCupo}" ya existe en esa zona`)

    const cupo = this.cupoRepo.create({
      zonaId:    dto.zonaId,
      sedeId:    zona.sedeId,
      numeroCupo: dto.numeroCupo,
      tipoCupo:   dto.tipoCupo,
      estado:     EstadoCupo.DISPONIBLE,
    })
    await this.cupoRepo.save(cupo)
    return this.mapCupo(cupo)
  }

  async cambiarEstadoCupo(id: number, dto: CambiarEstadoCupoDto) {
    const c = await this.cupoRepo.findOne({ where: { id }, relations: ['zona'] })
    if (!c) throw new NotFoundException(`Cupo #${id} no encontrado`)

    c.estado      = dto.estado
    c.observacion = dto.observacion ?? c.observacion
    await this.cupoRepo.save(c)
    return this.mapCupo(c)
  }

  // ── Ocupación en tiempo real ────────────────────────────────────

  async getOcupacion(sedeId: number) {
    const zonas = await this.zonaRepo.find({
      where: { sedeId, activa: true },
      relations: ['cupos'],
      order: { nombre: 'ASC' },
    })

    // Vehículos dentro: entradas sin salida posterior en 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dentroResult = await this.accesoRepo
      .createQueryBuilder('a')
      .select('a.placa')
      .where('a.sedeId = :sedeId', { sedeId })
      .andWhere('a.tipoAcceso = :tipo', { tipo: 'ENTRADA' })
      .andWhere('a.resultado = :r',     { r: 'AUTORIZADO' })
      .andWhere('a.fechaHora >= :desde', { desde: cutoff })
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM parking_accesos s
        WHERE s.placa = a.placa
          AND s.sede_id = a.sede_id
          AND s.tipo_acceso = 'SALIDA'
          AND s.fecha_hora > a.fecha_hora
          AND s.deleted_at IS NULL
      )`)
      .distinct(true)
      .getCount()

    const totalCapacidad = zonas.reduce((sum, z) => sum + z.capacidadTotal, 0)

    const zonasDetalle = zonas.map(z => {
      const cuposData = z.cupos ?? []
      const ocupados   = cuposData.filter(c => c.estado === EstadoCupo.OCUPADO).length
      const bloqueados = cuposData.filter(c => c.estado === EstadoCupo.BLOQUEADO || c.estado === EstadoCupo.MANTENIMIENTO).length
      const disponibles = Math.max(0, z.capacidadTotal - ocupados - bloqueados)
      return {
        id:          z.id,
        nombre:      z.nombre,
        total:       z.capacidadTotal,
        disponibles,
        ocupados,
        bloqueados,
        porcentaje:  z.capacidadTotal > 0 ? Math.round((ocupados / z.capacidadTotal) * 100) : 0,
        cupos: cuposData.map(c => ({
          id:          c.id,
          numero:      c.numeroCupo,
          estado:      c.estado,
          tipo:        c.tipoCupo,
        })),
      }
    })

    return {
      sede_id:      sedeId,
      resumen: {
        total:        totalCapacidad,
        disponibles:  Math.max(0, totalCapacidad - dentroResult),
        ocupados:     dentroResult,
        porcentaje:   totalCapacidad > 0 ? Math.round((dentroResult / totalCapacidad) * 100) : 0,
      },
      zonas: zonasDetalle,
    }
  }
}
