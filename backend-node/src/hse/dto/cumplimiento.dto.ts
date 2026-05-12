import { IsInt, IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';

export class CumplimientoIniciarDto {
  @IsInt()
  contratistaId: number;

  @IsInt()
  sedeId: number;

  @IsOptional()
  @IsArray()
  itemsRequisitos?: string[];
}

export class CumplimientoActualizarDto {
  @IsOptional()
  @IsArray()
  items?: Array<{
    itemId: number;
    cumple?: boolean;
    observacion?: string;
  }>;

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
