import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAutorizacionDto } from '../dto/autorizacion.dto';

@Injectable()
export class AutorizacionValidator {
  validarFechas(fechaInicio: string | Date, fechaFin: string | Date) {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (start < hoy) {
      throw new BadRequestException('La fecha de inicio no puede ser en el pasado');
    }

    if (end < start) {
      throw new BadRequestException('La fecha de fin no puede ser menor a la fecha de inicio');
    }
  }

  // Other business logic validations could go here
}
