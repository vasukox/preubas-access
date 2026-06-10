import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParkingSolicitud } from '../entities/parking-solicitud.entity'
import { EstadoSolicitudParking } from '../../common/enums/parking.enum'

@Injectable()
export class ParkingTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(ParkingSolicitud)
    private readonly solicitudRepo: Repository<ParkingSolicitud>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.params?.token as string | undefined

    if (!token) {
      throw new UnauthorizedException('Token de autogestión requerido')
    }

    const solicitud = await this.solicitudRepo.findOne({
      where: { tokenAutogestion: token },
      relations: ['sede'],
    })

    if (!solicitud) {
      throw new UnauthorizedException('Token de autogestión inválido')
    }

    if (solicitud.tokenExpiraEn && solicitud.tokenExpiraEn < new Date()) {
      throw new UnauthorizedException('El enlace de autogestión ha expirado. Solicita uno nuevo al administrador.')
    }

    const estadosValidos = [
      EstadoSolicitudParking.PENDIENTE_AUTOGESTION,
      EstadoSolicitudParking.AUTOGESTION_EN_PROGRESO,
    ]

    if (!estadosValidos.includes(solicitud.estado)) {
      throw new UnauthorizedException(
        solicitud.estado === EstadoSolicitudParking.AUTOGESTION_COMPLETADA
          ? 'La autogestión ya fue completada para esta solicitud'
          : 'Esta solicitud no está disponible para autogestión',
      )
    }

    request.parkingSolicitud = solicitud
    return true
  }
}
