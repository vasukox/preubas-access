import { IsInt, IsOptional, IsArray, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CumplimientoIniciarDto {
  @IsInt()
  contratista_id: number;

  @IsInt()
  sede_id: number;
}

export class CumplimientoItemActualizarDto {
  @IsInt()
  item_id: number;

  @IsOptional()
  @IsBoolean()
  cumple?: boolean;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class CumplimientoActualizarDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CumplimientoItemActualizarDto)
  items: CumplimientoItemActualizarDto[];

  @IsOptional()
  @IsString()
  observacion_general?: string;
}

export class CumplimientoCerrarDto {
  @IsString()
  firma_digital: string;

  @IsOptional()
  @IsString()
  observacion_general?: string;
}

export class MarcarItemCumplimientoDto {
  @IsBoolean()
  cumple: boolean;

  @IsOptional()
  @IsString()
  observacion?: string;
}
