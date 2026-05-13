import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAutorizacionDto } from '../dto/autorizacion.dto';

@Injectable()
export class AutorizacionValidator {
  validarFechas(fechaInicio: string | Date, fechaFin: string | Date) {
    const hoy   = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    const start = String(fechaInicio).slice(0, 10);
    const end   = String(fechaFin).slice(0, 10);

    if (start < hoy) {
      throw new BadRequestException('La fecha de inicio no puede ser anterior al día de hoy');
    }

    if (end < start) {
      throw new BadRequestException('La fecha de fin no puede ser menor a la fecha de inicio');
    }
  }

  // Other business logic validations could go here
}
