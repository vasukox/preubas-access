import { IsNotEmpty, IsOptional, IsEnum, IsString, IsEmail, IsBoolean, IsInt } from 'class-validator';
import { TipoDocumento } from '../../common/enums/hse.enum';

export class CreateContratistaDto {
  @IsOptional()
  @IsInt()
  persona_id?: number;

  @IsNotEmpty()
  @IsEnum(TipoDocumento)
  tipo_documento: TipoDocumento;

  @IsNotEmpty()
  @IsString()
  numero_documento: string;

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
  es_extranjero?: boolean;

  @IsOptional()
  @IsString()
  sst_responsable_nombre?: string;

  @IsOptional()
  @IsString()
  sst_responsable_telefono?: string;
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
  seg_social_id?: number;
}
