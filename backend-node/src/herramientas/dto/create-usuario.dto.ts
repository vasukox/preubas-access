import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsArray, IsObject, IsInt, IsBoolean, ArrayMinSize } from 'class-validator';

export class PermisosDto {
  @IsOptional()
  @IsBoolean()
  ver?: boolean;

  @IsOptional()
  @IsBoolean()
  crear?: boolean;

  @IsOptional()
  @IsBoolean()
  editar?: boolean;

  @IsOptional()
  @IsBoolean()
  eliminar?: boolean;
}

export class CreateUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombres: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  apellidos: string;

  @IsString()
  @MinLength(7)
  @MaxLength(20)
  numero: string;

  @IsString()
  @MinLength(5)
  @MaxLength(150)
  direccion: string;

  @IsOptional()
  @IsString()
  rolNombre?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rolesNombres?: string[];

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(8)
  passwordConfirmacion: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  firmaCreador?: string;

  @IsOptional()
  @IsObject()
  permisos?: PermisosDto;

  @IsOptional()
  @IsInt()
  sedeAsignadaId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  sedesAsignadasIds?: number[];
}
