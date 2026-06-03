import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TipoContratista,
  EstadoAutorizacion,
} from '../../common/enums/hse.enum';
import { CreateContratistaDto } from './contratista.dto';

export class CreateAutorizacionDto {
  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsNotEmpty()
  @IsInt()
  sedeId: number;

  @IsOptional()
  @IsInt()
  responsableInternoId?: number;

  @IsNotEmpty()
  @IsEnum(TipoContratista)
  tipoContratista: TipoContratista;

  @IsNotEmpty()
  @IsString()
  descripcionActividad: string;

  @IsNotEmpty()
  @IsDateString()
  fechaInicio: string;

  @IsNotEmpty()
  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContratistaDto)
  contratistas?: CreateContratistaDto[];
}

export class UpdateAutorizacionDto {
  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  sedeId?: number;

  @IsOptional()
  @IsInt()
  responsableInternoId?: number;

  @IsOptional()
  @IsEnum(TipoContratista)
  tipoContratista?: TipoContratista;

  @IsOptional()
  @IsString()
  descripcionActividad?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class ChangeEstadoAutorizacionDto {
  @IsNotEmpty()
  @IsEnum(EstadoAutorizacion)
  estado: EstadoAutorizacion;

  @IsOptional()
  @IsString()
  motivoDenegacion?: string;
}
