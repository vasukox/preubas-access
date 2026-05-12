import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GhEstadoSesionInduccion } from '../../../common/enums/gh.enum';

export class EstadoSesionInduccionDto {
  @IsEnum(GhEstadoSesionInduccion)
  estadoSesion: GhEstadoSesionInduccion;

  @IsOptional()
  @IsString()
  motivo?: string;
}
