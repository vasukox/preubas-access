import { GhEstadoSesionInduccion, GhEstadoAsistenciaInduccion } from '../../../common/enums/gh.enum';
import { CandidatoResponseDto } from './candidato-response.dto';

export class PortalInduccionValidateResponseDto {
  token: string;
  vigente: boolean;
  ventanaHabilitada: boolean;
  sesionId: number;
  estadoSesion: GhEstadoSesionInduccion;
  candidato: CandidatoResponseDto;
  estadoAsistencia: GhEstadoAsistenciaInduccion;
  checkinAt: string | null;
  checkoutAt: string | null;
}

export class PortalInduccionAccionResponseDto {
  token: string;
  accion: 'CHECKIN' | 'CHECKOUT';
  estadoAsistencia: GhEstadoAsistenciaInduccion;
  timestamp: string;
}
