import { IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { GhTipoCita } from '../../../common/enums/gh.enum';

export class ActualizarCitaDto {
  @IsOptional()
  @IsEnum(GhTipoCita)
  tipoCita?: GhTipoCita;

  @IsOptional()
  @IsDateString()
  fechaHoraInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaHoraFin?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
