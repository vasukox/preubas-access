import {
  IsInt,
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CumplimientoIniciarDto {
  @IsInt()
  contratistaId: number;

  @IsInt()
  sedeId: number;
}

export class CumplimientoItemActualizarDto {
  @IsInt()
  itemId: number;

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
  observacionGeneral?: string;
}

export class CumplimientoCerrarDto {
  @IsString()
  firmaDigital: string;

  @IsOptional()
  @IsString()
  observacionGeneral?: string;
}

export class MarcarItemCumplimientoDto {
  @IsBoolean()
  cumple: boolean;

  @IsOptional()
  @IsString()
  observacion?: string;
}
