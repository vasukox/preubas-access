import { IsInt, IsString, IsDateString, IsArray, ArrayMinSize, IsOptional } from 'class-validator';

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

export class CreateExcepcionLoteDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  personasIds?: number[];

  @IsOptional()
  @IsArray()
  contratistas?: Array<{
    tipoDocumento?: string;
    numeroDocumento: string;
    nombreCompleto: string;
  }>;

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
