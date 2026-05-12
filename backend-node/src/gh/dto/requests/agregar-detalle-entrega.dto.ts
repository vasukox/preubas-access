import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

export class AgregarDetalleEntregaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  itemCodigo: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  itemNombre: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidadEsperada?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidadEntregada?: number;

  @IsOptional()
  @IsString()
  evidenciaUrl?: string | null;
}
