import { IsString, IsInt, IsOptional, IsDateString, IsArray, ValidateNested, MinLength, MaxLength, IsEnum, IsUrl, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { GhTipoSesion } from '../../../common/enums/gh.enum';

export class InduccionAsistenteCreateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  tipoDocumento: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  numeroDocumento: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombres: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  apellidos: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;
}

export class CrearSesionInduccionDto {
  @IsInt()
  sedeId: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  area: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tipoInduccion: string;

  @IsOptional()
  @IsEnum(GhTipoSesion)
  tipoSesion?: GhTipoSesion;

  @IsOptional()
  @IsString()
  linkVirtual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  salaFisica?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacidadMaxima?: number;

  @IsOptional()
  @IsInt()
  responsableUsuarioId?: number;

  @IsDateString()
  fechaHoraInicio: string;

  @IsDateString()
  fechaHoraFin: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  citaIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InduccionAsistenteCreateDto)
  asistentes?: InduccionAsistenteCreateDto[];
}
