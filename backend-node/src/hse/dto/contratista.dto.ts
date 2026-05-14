import { IsNotEmpty, IsOptional, IsEnum, IsString, IsEmail, IsBoolean, IsInt } from 'class-validator';
import { TipoDocumento } from '../../common/enums/hse.enum';

export class CreateContratistaDto {
  @IsOptional()
  @IsInt()
  personaId?: number;

  @IsNotEmpty()
  @IsEnum(TipoDocumento)
  tipoDocumento: TipoDocumento;

  @IsNotEmpty()
  @IsString()
  numeroDocumento: string;

  @IsNotEmpty()
  @IsString()
  nombres: string;

  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  esExtranjero?: boolean;

  @IsOptional()
  @IsString()
  sstResponsableNombre?: string;

  @IsOptional()
  @IsString()
  sstResponsableTelefono?: string;
}

export class GenerarTokenDto {
  @IsOptional()
  @IsInt()
  duracionHoras?: number;
}

export class EliminarContratistaDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class EliminarAdjuntoContratistaDto {
  @IsNotEmpty()
  @IsString()
  modulo: string;

  @IsNotEmpty()
  @IsString()
  campo: string;

  @IsOptional()
  @IsInt()
  segSocialId?: number;
}
