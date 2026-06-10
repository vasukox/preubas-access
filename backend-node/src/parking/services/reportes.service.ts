import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingAcceso }       from '../entities/parking-acceso.entity'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { ParkingDocumento }    from '../entities/parking-documento.entity'
import { ParkingNovedad }      from '../entities/parking-novedad.entity'
import { ParkingExcepcion }    from '../entities/parking-excepcion.entity'
import { ParkingVehiculo }     from '../entities/parking-vehiculo.entity'
import {
  EstadoAutorizacionParking, EstadoDocumentoParking,
} from '../../common/enums/parking.enum'

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(ParkingAcceso)
    private readonly accesoRepo: Repository<ParkingAcceso>,

    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,

    @InjectRepository(ParkingDocumento)
    private readonly documentoRepo: Repository<ParkingDocumento>,

    @InjectRepository(ParkingNovedad)
    private readonly novedadRepo: Repository<ParkingNovedad>,

    @InjectRepository(ParkingExcepcion)
    private readonly excepcionRepo: Repository<ParkingExcepcion>,

    @InjectRepository(ParkingVehiculo)
    private readonly vehiculoRepo: Repository<ParkingVehiculo>,
  ) {}

  async reporteAccesos(params: {
    sede_id: number; fecha_desde: string; fecha_hasta: string;
    tipo_vehiculo?: string; resultado?: string
  }) {
    const qb = this.accesoRepo
      .createQueryBuilder('a')
      .where('a.sedeId = :sid',          { sid: params.sede_id })
      .andWhere('a.fechaHora >= :fd',    { fd: params.fecha_desde })
      .andWhere('a.fechaHora <= :fh',    { fh: params.fecha_hasta })
      .orderBy('a.fechaHora', 'DESC')

    if (params.tipo_vehiculo) qb.andWhere('a.tipoVehiculo = :tv', { tv: params.tipo_vehiculo })
    if (params.resultado)     qb.andWhere('a.resultado = :r',     { r: params.resultado })

    const accesos = await qb.getMany()
    const entradas = accesos.filter(a => a.tipoAcceso === 'ENTRADA').length
    const salidas  = accesos.filter(a => a.tipoAcceso === 'SALIDA').length

    return {
      resumen: { total: accesos.length, entradas, salidas },
      items: accesos.map(a => ({
        id: a.id, placa: a.placa, tipo_acceso: a.tipoAcceso,
        resultado: a.resultado, metodo: a.metodo, fecha_hora: a.fechaHora,
      })),
    }
  }

  async reporteAutorizaciones(params: {
    sede_id?: number; estado?: string; tipo_autorizacion?: string;
    fecha_desde?: string; fecha_hasta?: string
  }) {
    const qb = this.autorizacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.vehiculo', 'v')
      .leftJoinAndSelect('a.persona',  'p')
      .orderBy('a.created_at', 'DESC')

    if (params.sede_id)          qb.andWhere('a.sedeId = :sid',  { sid: params.sede_id })
    if (params.estado)           qb.andWhere('a.estado = :e',    { e: params.estado })
    if (params.tipo_autorizacion) qb.andWhere('a.tipoAutorizacion = :ta', { ta: params.tipo_autorizacion })
    if (params.fecha_desde)      qb.andWhere('a.fechaInicio >= :fd', { fd: params.fecha_desde })
    if (params.fecha_hasta)      qb.andWhere('a.fechaFin <= :fh',    { fh: params.fecha_hasta })

    const items = await qb.getMany()
    return {
      total: items.length,
      items: items.map(a => ({
        id: a.id, tipo: a.tipoAutorizacion, estado: a.estado,
        fecha_inicio: a.fechaInicio, fecha_fin: a.fechaFin,
        placa: a.vehiculo?.placa ?? null,
      })),
    }
  }

  async reporteVencimientos(params: { sede_id: number; dias_proximos?: number }) {
    const dias   = params.dias_proximos ?? 30
    const ahora  = new Date()
    const limite = new Date()
    limite.setDate(limite.getDate() + dias)

    // Autorizaciones por vencer
    const autorizaciones = await this.autorizacionRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.vehiculo', 'v')
      .where('a.sedeId = :sid',  { sid: params.sede_id })
      .andWhere('a.estado = :e', { e: EstadoAutorizacionParking.ACTIVA })
      .andWhere('a.fechaFin BETWEEN :ahora AND :limite', { ahora, limite })
      .orderBy('a.fechaFin', 'ASC')
      .getMany()

    // Documentos por vencer
    const documentos = await this.documentoRepo
      .createQueryBuilder('d')
      .innerJoin('d.solicitud', 's', 's.sedeId = :sid AND s.deleted_at IS NULL', { sid: params.sede_id })
      .where('d.fechaVencimiento IS NOT NULL')
      .andWhere('d.fechaVencimiento BETWEEN :ahora AND :limite', { ahora, limite })
      .andWhere('d.estado IN (:...estados)', {
        estados: [EstadoDocumentoParking.VIGENTE, EstadoDocumentoParking.POR_VENCER],
      })
      .orderBy('d.fechaVencimiento', 'ASC')
      .getMany()

    return {
      autorizaciones_por_vencer: autorizaciones.map(a => ({
        id: a.id, placa: a.vehiculo?.placa ?? null,
        fecha_fin: a.fechaFin,
        dias_restantes: Math.ceil((a.fechaFin.getTime() - ahora.getTime()) / 86400000),
      })),
      documentos_por_vencer: documentos.map(d => ({
        id: d.id, tipo: d.tipoDocumento,
        fecha_vencimiento: d.fechaVencimiento,
        dias_restantes: d.fechaVencimiento
          ? Math.ceil((new Date(d.fechaVencimiento).getTime() - ahora.getTime()) / 86400000)
          : null,
      })),
    }
  }

  async reporteNovedades(params: {
    sede_id?: number; estado?: string; tipo_novedad?: string;
    fecha_desde?: string; fecha_hasta?: string
  }) {
    const qb = this.novedadRepo.createQueryBuilder('n').orderBy('n.created_at', 'DESC')
    if (params.sede_id)    qb.andWhere('n.sedeId = :sid',       { sid: params.sede_id })
    if (params.estado)     qb.andWhere('n.estado = :e',         { e: params.estado })
    if (params.tipo_novedad) qb.andWhere('n.tipoNovedad = :tn', { tn: params.tipo_novedad })
    if (params.fecha_desde) qb.andWhere('n.created_at >= :fd',  { fd: params.fecha_desde })
    if (params.fecha_hasta) qb.andWhere('n.created_at <= :fh',  { fh: params.fecha_hasta })
    const items = await qb.getMany()
    return { total: items.length, items }
  }

  async reporteVehiculos(params: { sede_id?: number; tipo_vehiculo?: string; activo?: boolean }) {
    const qb = this.vehiculoRepo.createQueryBuilder('v').leftJoinAndSelect('v.persona','p')
    if (params.sede_id)     qb.andWhere('v.sedeId = :sid',       { sid: params.sede_id })
    if (params.tipo_vehiculo) qb.andWhere('v.tipoVehiculo = :tv', { tv: params.tipo_vehiculo })
    if (params.activo !== undefined) qb.andWhere('v.activo = :ac', { ac: params.activo })
    const items = await qb.getMany()
    return { total: items.length, items: items.map(v => ({ id: v.id, placa: v.placa, tipo_vehiculo: v.tipoVehiculo, activo: v.activo })) }
  }

  async reporteExcepciones(params: {
    sede_id?: number; activa?: boolean; tipo_excepcion?: string;
    fecha_desde?: string; fecha_hasta?: string
  }) {
    const qb = this.excepcionRepo.createQueryBuilder('e').orderBy('e.created_at', 'DESC')
    if (params.sede_id)     qb.andWhere('e.sedeId = :sid',         { sid: params.sede_id })
    if (params.activa !== undefined) qb.andWhere('e.activa = :ac', { ac: params.activa })
    if (params.tipo_excepcion) qb.andWhere('e.tipoExcepcion = :te', { te: params.tipo_excepcion })
    if (params.fecha_desde)  qb.andWhere('e.fechaInicio >= :fd',   { fd: params.fecha_desde })
    if (params.fecha_hasta)  qb.andWhere('e.fechaFin <= :fh',      { fh: params.fecha_hasta })
    const items = await qb.getMany()
    return { total: items.length, items }
  }

  async charts(params: { sede_id: number; periodo?: '7d' | '30d' | '90d' }) {
    const dias   = params.periodo === '90d' ? 90 : params.periodo === '7d' ? 7 : 30
    const desde  = new Date()
    desde.setDate(desde.getDate() - dias)

    // Accesos por día
    const accesosRaw = await this.accesoRepo
      .createQueryBuilder('a')
      .select("DATE_FORMAT(a.fechaHora, '%Y-%m-%d')", 'fecha')
      .addSelect("SUM(CASE WHEN a.tipoAcceso = 'ENTRADA' THEN 1 ELSE 0 END)", 'entradas')
      .addSelect("SUM(CASE WHEN a.tipoAcceso = 'SALIDA' THEN 1 ELSE 0 END)", 'salidas')
      .where('a.sedeId = :sid', { sid: params.sede_id })
      .andWhere('a.fechaHora >= :desde', { desde })
      .groupBy("DATE_FORMAT(a.fechaHora, '%Y-%m-%d')")
      .orderBy('fecha', 'ASC')
      .getRawMany<{ fecha: string; entradas: string; salidas: string }>()

    // Vehículos por tipo
    const vehiculosPorTipo = await this.vehiculoRepo
      .createQueryBuilder('v')
      .select('v.tipoVehiculo', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .where('v.sedeId = :sid', { sid: params.sede_id })
      .andWhere('v.activo = true')
      .groupBy('v.tipoVehiculo')
      .getRawMany<{ tipo: string; total: string }>()

    // Novedades por tipo
    const novedadesPorTipo = await this.novedadRepo
      .createQueryBuilder('n')
      .select('n.tipoNovedad', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .where('n.sedeId = :sid', { sid: params.sede_id })
      .andWhere('n.created_at >= :desde', { desde })
      .groupBy('n.tipoNovedad')
      .getRawMany<{ tipo: string; total: string }>()

    return {
      accesos_por_dia: accesosRaw.map(r => ({
        fecha: r.fecha,
        entradas: parseInt(r.entradas, 10),
        salidas:  parseInt(r.salidas, 10),
      })),
      vehiculos_por_tipo: vehiculosPorTipo.map(r => ({
        tipo: r.tipo, total: parseInt(r.total, 10),
      })),
      novedades_por_tipo: novedadesPorTipo.map(r => ({
        tipo: r.tipo, total: parseInt(r.total, 10),
      })),
    }
  }
}
