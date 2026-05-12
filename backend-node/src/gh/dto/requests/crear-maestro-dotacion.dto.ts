import { IsString, IsOptional, IsBoolean, IsInt, MinLength, MaxLength, Min } from 'class-validator';

export class CrearMaestroDotacionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sedeId?: number | null;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  area: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  cargo: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  tipoContrato: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  kitCodigo: string;

  @IsString()
  @MinLength(1)
  kitDescripcion: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
