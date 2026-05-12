import { GhEstadoSesionInduccion, GhEstadoAsistenciaInduccion, GhTipoSesion } from '../../../common/enums/gh.enum';
import { CandidatoResponseDto } from './candidato-response.dto';

export class InduccionAsistenciaResponseDto {
  id: number;
  candidato: CandidatoResponseDto;
  estadoAsistencia: GhEstadoAsistenciaInduccion;
  tokenAutogestion: string;
  checkinAt: string | null;
  checkoutAt: string | null;
  intentosCodigo: number;
  ultimoErrorCodigo: string | null;
}

export class SesionInduccionResponseDto {
  id: number;
  sedeId: number;
  area: string;
  tipoInduccion: string;
  tipoSesion: GhTipoSesion;
  linkVirtual: string | null;
  salaFisica: string | null;
  descripcion: string | null;
  capacidadMaxima: number | null;
  responsableUsuarioId: number | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estadoSesion: GhEstadoSesionInduccion;
  codigoCheckinActual: string | null;
  codigoCheckoutActual: string | null;
  fechaCierre: string | null;
  asistentes: InduccionAsistenciaResponseDto[];
  relatedCitaIds: number[];
  totalAsistentes: number;
  totalCheckin: number;
  totalCheckout: number;
}

export class CodigoTemporalResponseDto {
  sesionId: number;
  tipo: 'CHECKIN' | 'CHECKOUT';
  codigo: string;
  expiraEn: string;
}
