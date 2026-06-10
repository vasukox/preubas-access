import {
  IsString, IsInt, IsOptional, IsEnum, IsNotEmpty, Min, IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { MetodoAccesoParking } from '../../common/enums/parking.enum'

export class VerificarPlacaDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsString() @IsNotEmpty()
  placa: string

  @IsOptional() @IsString()
  tipoBusqueda?: string
}

export class RegistrarEntradaDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsString() @IsNotEmpty()
  placa: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  autorizacionId?: number

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  excepcionId?: number

  @IsEnum(MetodoAccesoParking)
  metodo: MetodoAccesoParking

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  cupoId?: number | null

  @IsOptional() @IsString()
  observacion?: string | null
}

export class RegistrarSalidaDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsString() @IsNotEmpty()
  placa: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  autorizacionId?: number

  @IsEnum(MetodoAccesoParking)
  metodo: MetodoAccesoParking

  @IsOptional() @IsString()
  observacion?: string | null
}
