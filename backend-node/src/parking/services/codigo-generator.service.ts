import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingSolicitud } from '../entities/parking-solicitud.entity'

@Injectable()
export class CodigoGeneratorService {
  constructor(
    @InjectRepository(ParkingSolicitud)
    private readonly solicitudRepo: Repository<ParkingSolicitud>,
  ) {}

  async generarCodigoSolicitud(): Promise<string> {
    const anio = new Date().getFullYear()
    const prefix = `PKG-${anio}-`

    // Obtener el mayor número de secuencia del año actual (withDeleted para no reutilizar)
    const resultado = await this.solicitudRepo
      .createQueryBuilder('s')
      .select('MAX(CAST(SUBSTRING(s.codigo, :offset, 4) AS UNSIGNED))', 'max')
      .where('s.codigo LIKE :pattern', { pattern: `${prefix}%` })
      .setParameter('offset', prefix.length + 1)
      .withDeleted()
      .getRawOne<{ max: string | null }>()

    const siguiente = resultado?.max ? parseInt(resultado.max, 10) + 1 : 1
    return `${prefix}${String(siguiente).padStart(4, '0')}`
  }
}
