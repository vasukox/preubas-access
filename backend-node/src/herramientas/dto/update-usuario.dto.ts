import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombreCompleto?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  numero?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
