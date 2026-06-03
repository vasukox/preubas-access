import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

const TIPOS_ID = ['NIT', 'CC', 'CE', 'PASAPORTE'] as const;

export class CreateProveedorDto {
  @IsNotEmpty()
  @IsString()
  nomProveedor: string;

  @IsNotEmpty()
  @IsString()
  nitProveedor: string;

  @IsOptional()
  @IsEnum(TIPOS_ID)
  tipoIdentificacionProv?: string;

  @IsOptional()
  @IsBoolean()
  estadoProv?: boolean;

  @IsOptional()
  @IsString()
  direccionProv?: string;

  @IsOptional()
  @IsString()
  telefonoProv?: string;

  @IsOptional()
  @IsEmail()
  emailContacto?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsBoolean()
  tratamientoDatos?: boolean;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  nomProveedor?: string;

  @IsOptional()
  @IsString()
  nitProveedor?: string;

  @IsOptional()
  @IsEnum(TIPOS_ID)
  tipoIdentificacionProv?: string;

  @IsOptional()
  @IsBoolean()
  estadoProv?: boolean;

  @IsOptional()
  @IsString()
  direccionProv?: string;

  @IsOptional()
  @IsString()
  telefonoProv?: string;

  @IsOptional()
  @IsEmail()
  emailContacto?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsBoolean()
  tratamientoDatos?: boolean;

  @IsOptional()
  @IsString()
  notas?: string;
}
