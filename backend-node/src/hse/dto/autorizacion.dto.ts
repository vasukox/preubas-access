import { IsNotEmpty, IsInt, IsOptional, IsEnum, IsString, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoContratista, EstadoAutorizacion } from '../../common/enums/hse.enum';
import { CreateContratistaDto } from './contratista.dto';

export class CreateAutorizacionDto {
  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsNotEmpty()
  @IsInt()
  sede_id: number;

  @IsOptional()
  @IsInt()
  responsable_interno_id?: number;

  @IsNotEmpty()
  @IsEnum(TipoContratista)
  tipo_contratista: TipoContratista;

  @IsNotEmpty()
  @IsString()
  descripcion_actividad: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContratistaDto)
  contratistas?: CreateContratistaDto[];
}

export class UpdateAutorizacionDto {
  @IsOptional()
  @IsInt()
  proveedor_id?: number;

  @IsOptional()
  @IsInt()
  sede_id?: number;

  @IsOptional()
  @IsInt()
  responsable_interno_id?: number;

  @IsOptional()
  @IsEnum(TipoContratista)
  tipo_contratista?: TipoContratista;

  @IsOptional()
  @IsString()
  descripcion_actividad?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}

export class ChangeEstadoAutorizacionDto {
  @IsNotEmpty()
  @IsEnum(EstadoAutorizacion)
  estado: EstadoAutorizacion;

  @IsOptional()
  @IsString()
  motivo_denegacion?: string;
}
