import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
