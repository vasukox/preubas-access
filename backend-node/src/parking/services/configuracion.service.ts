import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingPoliticaSede } from '../entities/parking-politica-sede.entity'
import { CatalogosService } from './catalogos.service'
import { UpdatePoliticaDto } from '../dto/configuracion.dto'

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ParkingPoliticaSede)
    private readonly politicaRepo: Repository<ParkingPoliticaSede>,

    private readonly catalogosService: CatalogosService,
  ) {}

  async getPolitica(sedeId: number) {
    const politica = await this.politicaRepo.findOne({ where: { sedeId } })
    if (!politica) throw new NotFoundException(`No existe configuración de parking para la sede ${sedeId}`)
    return this.catalogosService.mapPolitica(politica)
  }

  async updatePolitica(sedeId: number, dto: UpdatePoliticaDto) {
    const politica = await this.politicaRepo.findOne({ where: { sedeId } })
    if (!politica) throw new NotFoundException(`No existe configuración de parking para la sede ${sedeId}`)

    if (dto.maxVehiculosPorPersona !== undefined) politica.maxVehiculosPorPersona = dto.maxVehiculosPorPersona
    if (dto.requiereSoat !== undefined)               politica.requiereSoat = dto.requiereSoat
    if (dto.requiereTecnomecanica !== undefined)      politica.requiereTecnomecanica = dto.requiereTecnomecanica
    if (dto.requiereLicencia !== undefined)           politica.requiereLicencia = dto.requiereLicencia
    if (dto.diasAlertaVencimientoDocs !== undefined) politica.diasAlertaVencimientoDocs = dto.diasAlertaVencimientoDocs
    if (dto.permiteVehiculoReemplazo !== undefined)  politica.permiteVehiculoReemplazo = dto.permiteVehiculoReemplazo
    if (dto.permiteEntradaUnicaVisitantes !== undefined) politica.permiteEntradaUnicaVisitantes = dto.permiteEntradaUnicaVisitantes
    if (dto.requiereAprobacionJefe !== undefined)    politica.requiereAprobacionJefe = dto.requiereAprobacionJefe
    if (dto.horarioInicioOperacion !== undefined)    politica.horarioInicioOperacion = dto.horarioInicioOperacion
    if (dto.horarioFinOperacion !== undefined)       politica.horarioFinOperacion = dto.horarioFinOperacion

    await this.politicaRepo.save(politica)
    return this.catalogosService.mapPolitica(politica)
  }

  async inicializar(sedeId: number) {
    const existe = await this.politicaRepo.findOne({ where: { sedeId } })
    if (existe) return this.catalogosService.mapPolitica(existe)

    const nueva = this.politicaRepo.create({ sedeId })
    await this.politicaRepo.save(nueva)
    return this.catalogosService.mapPolitica(nueva)
  }
}
