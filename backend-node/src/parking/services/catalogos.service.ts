import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Sede } from '../../sede/entities/sede.entity'
import { ParkingZona } from '../entities/parking-zona.entity'
import { ParkingPoliticaSede } from '../entities/parking-politica-sede.entity'
import { TipoVehiculo, TipoUsuarioParking } from '../../common/enums/parking.enum'

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepo: Repository<Sede>,

    @InjectRepository(ParkingZona)
    private readonly zonaRepo: Repository<ParkingZona>,

    @InjectRepository(ParkingPoliticaSede)
    private readonly politicaRepo: Repository<ParkingPoliticaSede>,
  ) {}

  async getSedes() {
    const sedes = await this.sedeRepo.find({
      where: { activa: true },
      order: { nombre: 'ASC' },
      select: ['id', 'nombre', 'ciudad'],
    })
    return sedes
  }

  getTiposVehiculo(): string[] {
    return Object.values(TipoVehiculo)
  }

  getTiposUsuario(): string[] {
    return Object.values(TipoUsuarioParking)
  }

  async getZonasPorSede(sedeId: number) {
    const zonas = await this.zonaRepo.find({
      where: { sedeId, activa: true },
      order: { nombre: 'ASC' },
      select: ['id', 'nombre', 'capacidadTotal', 'capacidadCarros', 'capacidadMotos', 'capacidadBicis'],
    })
    return zonas.map(z => ({
      id: z.id,
      nombre: z.nombre,
      capacidad_total: z.capacidadTotal,
      capacidad_carros: z.capacidadCarros,
      capacidad_motos: z.capacidadMotos,
      capacidad_bicis: z.capacidadBicis,
    }))
  }

  async getPoliticaSede(sedeId: number) {
    const politica = await this.politicaRepo.findOne({ where: { sedeId } })
    if (!politica) return null
    return this.mapPolitica(politica)
  }

  mapPolitica(p: ParkingPoliticaSede) {
    return {
      id: p.id,
      sede_id: p.sedeId,
      max_vehiculos_por_persona: p.maxVehiculosPorPersona,
      requiere_soat: p.requiereSoat,
      requiere_tecnomecanica: p.requiereTecnomecanica,
      requiere_licencia: p.requiereLicencia,
      dias_alerta_vencimiento_docs: p.diasAlertaVencimientoDocs,
      permite_vehiculo_reemplazo: p.permiteVehiculoReemplazo,
      permite_entrada_unica_visitantes: p.permiteEntradaUnicaVisitantes,
      requiere_aprobacion_jefe: p.requiereAprobacionJefe,
      horario_inicio_operacion: p.horarioInicioOperacion,
      horario_fin_operacion: p.horarioFinOperacion,
      activa: p.activa,
    }
  }
}
