import {
  IsString, IsInt, IsOptional, IsEnum, IsNotEmpty, Min, Max, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { EstadoCupo, TipoCupo } from '../../common/enums/parking.enum'

export class CreateZonaDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsString() @IsNotEmpty() @MaxLength(100)
  nombre: string

  @IsOptional() @IsString()
  descripcion?: string

  @IsInt() @Min(1)
  capacidadTotal: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadCarros?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadMotos?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadBicis?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadElectricos?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadVisitantes?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadMovilidadReducida?: number
}

export class UpdateZonaDto {
  @IsOptional() @IsString() @MaxLength(100)
  nombre?: string

  @IsOptional() @IsString()
  descripcion?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  capacidadTotal?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadCarros?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadMotos?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadBicis?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadElectricos?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadVisitantes?: number

  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  capacidadMovilidadReducida?: number
}

export class CreateCupoDto {
  @IsInt() @Min(1)
  zonaId: number

  @IsString() @IsNotEmpty() @MaxLength(20)
  numeroCupo: string

  @IsEnum(TipoCupo)
  tipoCupo: TipoCupo
}

export class CambiarEstadoCupoDto {
  @IsEnum(EstadoCupo)
  estado: EstadoCupo

  @IsOptional() @IsString()
  observacion?: string
}

export class ListarCuposDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  zonaId?: number

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  sedeId?: number

  @IsOptional() @IsEnum(TipoCupo)
  tipoCupo?: TipoCupo

  @IsOptional() @IsEnum(EstadoCupo)
  estado?: EstadoCupo

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  perPage?: number
}
