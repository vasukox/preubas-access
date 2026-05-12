import { CitaResponseDto } from './cita-response.dto';

export class PortalValidateResponseDto {
  token: string;
  vigente: boolean;
  expiraEn: string;
  cita: CitaResponseDto;
}

export class PortalAccionResponseDto {
  token: string;
  accion: 'CONFIRMAR' | 'CANCELAR' | 'REAGENDAR';
  cita: CitaResponseDto;
}
