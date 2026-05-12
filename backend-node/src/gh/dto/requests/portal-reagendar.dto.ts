import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PortalReagendarDto {
  @IsDateString()
  fechaHoraInicio: string;

  @IsDateString()
  fechaHoraFin: string;

  @IsOptional()
  @IsString()
  comentario?: string;
}
