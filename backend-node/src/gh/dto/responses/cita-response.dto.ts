import { GhTipoCita, GhEstadoCita, GhEstadoSesionInduccion } from '../../../common/enums/gh.enum';
import { CandidatoResponseDto } from './candidato-response.dto';

export class CitaSesionInduccionResumenResponseDto {
  sesionId: number;
  estadoSesion: GhEstadoSesionInduccion;
  area: string;
  tipoInduccion: string;
}

export class CitaResponseDto {
  id: number;
  codigo: string;
  sedeId: number;
  tipoCita: GhTipoCita;
  estado: GhEstadoCita;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  observaciones: string | null;
  candidato: CandidatoResponseDto;
  sesionInduccion?: CitaSesionInduccionResumenResponseDto;
}
