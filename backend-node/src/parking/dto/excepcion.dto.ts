import {
  IsString, IsInt, IsOptional, IsEnum, IsNotEmpty, Min, IsArray,
  IsDateString, MaxLength, IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TipoExcepcion, AlcanceExcepcion } from '../../common/enums/parking.enum'

export class CreateExcepcionDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsEnum(TipoExcepcion)
  tipoExcepcion: TipoExcepcion

  @IsEnum(AlcanceExcepcion)
  alcance: AlcanceExcepcion

  @IsOptional() @IsString() @MaxLength(10)
  placa?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  personaId?: number

  @IsOptional() @IsString() @MaxLength(200)
  nombrePersona?: string

  @IsString() @IsNotEmpty()
  motivo: string

  @IsDateString()
  fechaInicio: string

  @IsDateString()
  fechaFin: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioInicio?: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioFin?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  zonaId?: number | null

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  usosPermitidos?: number | null
}

export class CreateExcepcionLoteDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsEnum(TipoExcepcion)
  tipoExcepcion: TipoExcepcion

  @IsEnum(AlcanceExcepcion)
  alcance: AlcanceExcepcion

  @IsDateString()
  fechaInicio: string

  @IsDateString()
  fechaFin: string

  @IsString() @IsNotEmpty()
  motivo: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioInicio?: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioFin?: string

  @IsArray() @IsString({ each: true })
  placas: string[]
}

export class AnularExcepcionDto {
  @IsString() @IsNotEmpty()
  motivo: string
}
