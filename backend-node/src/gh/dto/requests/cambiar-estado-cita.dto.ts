import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GhEstadoCita } from '../../../common/enums/gh.enum';

export class CambiarEstadoCitaDto {
  @IsEnum(GhEstadoCita)
  estado: GhEstadoCita;

  @IsOptional()
  @IsString()
  motivo?: string;
}
