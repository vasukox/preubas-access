import { IsInt, IsEnum, IsDateString, IsOptional, IsString, ValidateNested, ArrayMinSize, ArrayMaxSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { GhTipoCita } from '../../../common/enums/gh.enum';
import { GhCandidatoBaseDto } from '../gh-candidato.dto';

export class CrearCitaGrupoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GhCandidatoBaseDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  candidatos: GhCandidatoBaseDto[];

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
