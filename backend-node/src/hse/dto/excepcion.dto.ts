import { IsInt, IsString, IsDateString, IsArray, ArrayMinSize, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExcepcionDto {
  @IsOptional()
  @IsInt()
  personaId?: number;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  sedeId?: number;

  @IsString()
  motivo: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  ubicacionId?: number;
}

export class UpdateExcepcionDto {
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  sedeId?: number;

  @IsOptional()
  @IsInt()
  ubicacionId?: number;
}

export class ExcepcionLoteContratistaDto {
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsString()
  numeroDocumento: string;

  @IsString()
  nombreCompleto: string;
}

export class CreateExcepcionLoteDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  personasIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcepcionLoteContratistaDto)
  contratistas?: ExcepcionLoteContratistaDto[];

  @IsOptional()
  @IsInt()
  sedeId?: number;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsString()
  motivo: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
