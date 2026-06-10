import {
  IsString, IsInt, IsOptional, IsEnum, IsNotEmpty, Min, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TipoNovedad } from '../../common/enums/parking.enum'

export class CreateNovedadDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsEnum(TipoNovedad)
  tipoNovedad: TipoNovedad

  @IsString() @IsNotEmpty()
  descripcion: string

  @IsOptional() @IsString() @MaxLength(10)
  placa?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  autorizacionId?: number | null

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  accesoId?: number | null

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  personaId?: number | null
}

export class UpdateNovedadDto {
  @IsOptional() @IsString()
  descripcion?: string

  @IsOptional() @IsString()
  accionTomada?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  asignadoA?: number | null
}

export class EscalarNovedadDto {
  @IsString() @IsNotEmpty()
  observacion: string
}

export class CerrarNovedadDto {
  @IsString() @IsNotEmpty()
  observacionResolucion: string
}

export class AnularNovedadDto {
  @IsString() @IsNotEmpty()
  observacion: string
}
