import { IsInt, IsEnum, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GhTipoCita } from '../../../common/enums/gh.enum';
import { GhCandidatoBaseDto } from '../gh-candidato.dto';

export class CrearCitaDto {
  @ValidateNested()
  @Type(() => GhCandidatoBaseDto)
  candidato: GhCandidatoBaseDto;

  @IsInt()
  sedeId: number;

  @IsEnum(GhTipoCita)
  tipoCita: GhTipoCita;

  @IsDateString()
  fechaHoraInicio: string;

  @IsDateString()
  fechaHoraFin: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
