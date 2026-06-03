import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AutorizacionValidator {
  validarFechas(fechaInicio: string | Date, fechaFin: string | Date) {
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
    }).format(new Date());
    const start = this.toFechaStr(fechaInicio);
    const end = this.toFechaStr(fechaFin);

    if (start < hoy) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser anterior al día de hoy',
      );
    }

    if (end < start) {
      throw new BadRequestException(
        'La fecha de fin no puede ser menor a la fecha de inicio',
      );
    }
  }

  private toFechaStr(fecha: string | Date): string {
    if (fecha instanceof Date) {
      return fecha.toISOString().slice(0, 10);
    }
    return String(fecha).slice(0, 10);
  }
}
