import { IsInt, IsString, IsDateString, IsArray, ArrayMinSize, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExcepcionDto {
  @IsOptional()
  @IsInt()
  persona_id?: number;

  @IsOptional()
  @IsString()
  tipo_documento?: string;

  @IsOptional()
  @IsString()
  numero_documento?: string;

  @IsOptional()
  @IsString()
  nombre_completo?: string;

  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsOptional()
  @IsInt()
  sede_id?: number;

  @IsString()
  motivo: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsInt()
  ubicacion_id?: number;
}

export class UpdateExcepcionDto {
  @IsOptional()
  @IsString()
  tipo_documento?: string;

  @IsOptional()
  @IsString()
  numero_documento?: string;

  @IsOptional()
  @IsString()
  nombre_completo?: string;

  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsInt()
  ubicacion_id?: number;
}

export class ExcepcionLoteContratistaDto {
  @IsOptional()
  @IsString()
  tipo_documento?: string;

  @IsString()
  numero_documento: string;

  @IsString()
  nombre_completo: string;
}

export class CreateExcepcionLoteDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  personas_ids?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcepcionLoteContratistaDto)
  contratistas?: ExcepcionLoteContratistaDto[];

  @IsOptional()
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsString()
  motivo: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}
