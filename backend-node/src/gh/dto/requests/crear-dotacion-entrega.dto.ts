import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearDotacionEntregaDto {
  @IsInt()
  @Min(1)
  candidatoId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maestroDotacionId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  sesionOCitaId?: number | null;

  @IsOptional()
  @IsString()
  tipoReferencia?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargo?: string | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
