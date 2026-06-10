import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ParkingSolicitud } from '../entities/parking-solicitud.entity'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { ParkingAcceso } from '../entities/parking-acceso.entity'
import { ParkingNovedad } from '../entities/parking-novedad.entity'
import { ParkingDocumento } from '../entities/parking-documento.entity'
import { ParkingZona } from '../entities/parking-zona.entity'
import {
  EstadoSolicitudParking,
  EstadoAutorizacionParking,
  EstadoNovedad,
  EstadoDocumentoParking,
} from '../../common/enums/parking.enum'

@Injectable()
export class DashboardParkingService {
  constructor(
    @InjectRepository(ParkingSolicitud)
    private readonly solicitudRepo: Repository<ParkingSolicitud>,

    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,

    @InjectRepository(ParkingAcceso)
    private readonly accesoRepo: Repository<ParkingAcceso>,

    @InjectRepository(ParkingNovedad)
    private readonly novedadRepo: Repository<ParkingNovedad>,

    @InjectRepository(ParkingDocumento)
    private readonly documentoRepo: Repository<ParkingDocumento>,

    @InjectRepository(ParkingZona)
    private readonly zonaRepo: Repository<ParkingZona>,
  ) {}

  async getDashboard(sedeId: number) {
    const [
      solicitudesPendientes,
      autorizacionesActivas,
      autorizacionesPorVencer,
      novedadesActivas,
      documentosPorVencer,
      zonas,
      actividadReciente,
    ] = await Promise.all([
      this.contarSolicitudesPendientes(sedeId),
      this.contarAutorizacionesActivas(sedeId),
      this.contarAutorizacionesPorVencer(sedeId),
      this.contarNovedadesActivas(sedeId),
      this.contarDocumentosPorVencer(sedeId),
      this.obtenerZonasConOcupacion(sedeId),
      this.obtenerActividadReciente(sedeId),
    ])

    const vehiculosDentro = await this.contarVehiculosDentro(sedeId)
    const capacidadTotal  = zonas.reduce((s, z) => s + z.capacidad_total, 0)
    const porcentajeOcupacion = capacidadTotal > 0
      ? Math.round((vehiculosDentro / capacidadTotal) * 100)
      : 0

    return {
      ocupacion_actual: {
        total:       capacidadTotal,
        ocupados:    vehiculosDentro,
        disponibles: Math.max(0, capacidadTotal - vehiculosDentro),
        porcentaje:  porcentajeOcupacion,
      },
      solicitudes_pendientes:     solicitudesPendientes,
      autorizaciones_activas:     autorizacionesActivas,
      autorizaciones_por_vencer:  autorizacionesPorVencer,
      novedades_activas:          novedadesActivas,
      documentos_por_vencer:      documentosPorVencer,
      vehiculos_dentro:           vehiculosDentro,
      zonas,
      actividad_reciente:         actividadReciente,
    }
  }

  // ── Contadores ────────────────────────────────────────────────────

  private contarSolicitudesPendientes(sedeId: number): Promise<number> {
    return this.solicitudRepo.count({
      where: {
        sedeId,
        estado: In([
          EstadoSolicitudParking.PENDIENTE_AUTOGESTION,
          EstadoSolicitudParking.AUTOGESTION_COMPLETADA,
          EstadoSolicitudParking.EN_REVISION,
        ]),
      },
    })
  }

  private contarAutorizacionesActivas(sedeId: number): Promise<number> {
    return this.autorizacionRepo.count({
      where: { sedeId, estado: EstadoAutorizacionParking.ACTIVA },
    })
  }

  private async contarAutorizacionesPorVencer(sedeId: number): Promise<number> {
    const diasAlerta = 30
    const limite = new Date()
    limite.setDate(limite.getDate() + diasAlerta)

    return this.autorizacionRepo
      .createQueryBuilder('a')
      .where('a.sede_id = :sedeId', { sedeId })
      .andWhere('a.estado = :estado', { estado: EstadoAutorizacionParking.ACTIVA })
      .andWhere('a.fecha_fin <= :limite', { limite })
      .andWhere('a.deleted_at IS NULL')
      .getCount()
  }

  private contarNovedadesActivas(sedeId: number): Promise<number> {
    return this.novedadRepo.count({
      where: {
        sedeId,
        estado: In([
          EstadoNovedad.ABIERTA,
          EstadoNovedad.EN_REVISION,
          EstadoNovedad.ESCALADA,
        ]),
      },
    })
  }

  private contarDocumentosPorVencer(sedeId: number): Promise<number> {
    return this.documentoRepo
      .createQueryBuilder('d')
      .innerJoin('d.solicitud', 's')
      .where('s.sede_id = :sedeId', { sedeId })
      .andWhere('d.estado IN (:...estados)', { estados: [EstadoDocumentoParking.POR_VENCER] })
      .andWhere('d.deleted_at IS NULL')
      .getCount()
  }

  private async contarVehiculosDentro(sedeId: number): Promise<number> {
    // Vehículos dentro = placas con ENTRADA sin SALIDA posterior en las últimas 24h
    const result = await this.accesoRepo
      .createQueryBuilder('a')
      .select('a.placa')
      .where('a.sede_id = :sedeId', { sedeId })
      .andWhere('a.tipo_acceso = :tipo', { tipo: 'ENTRADA' })
      .andWhere('a.resultado = :resultado', { resultado: 'AUTORIZADO' })
      .andWhere('a.fecha_hora >= :desde', { desde: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .andWhere('a.deleted_at IS NULL')
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

    return result
  }

  private async obtenerZonasConOcupacion(sedeId: number) {
    const zonas = await this.zonaRepo.find({
      where: { sedeId, activa: true },
      order: { nombre: 'ASC' },
    })

    return zonas.map((z) => ({
      id:              z.id,
      nombre:          z.nombre,
      capacidad_total: z.capacidadTotal,
      ocupados:        0, // En MVP sin cupos → calculado en V2 cuando existan cupos numerados
      disponibles:     z.capacidadTotal,
      porcentaje:      0,
    }))
  }

  private async obtenerActividadReciente(sedeId: number) {
    const accesos = await this.accesoRepo.find({
      where: { sedeId },
      order: { fechaHora: 'DESC' },
      take: 15,
      relations: ['autorizacion', 'autorizacion.vehiculo', 'cupo', 'cupo.zona'],
    })

    return accesos.map((a) => ({
      id:          a.id,
      placa:       a.placa,
      tipo_acceso: a.tipoAcceso,
      resultado:   a.resultado,
      metodo:      a.metodo,
      zona:        a.cupo?.zona?.nombre ?? null,
      numero_cupo: a.cupo?.numeroCupo ?? null,
      fecha_hora:  a.fechaHora,
    }))
  }
}
