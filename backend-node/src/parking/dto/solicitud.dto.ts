import {
  IsEnum, IsString, IsInt, IsOptional, IsArray,
  IsDateString, MaxLength, Min, Max, IsNotEmpty, IsEmail,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TipoUsuarioParking, TipoVehiculo, TipoAutorizacion } from '../../common/enums/parking.enum'

export class CreateSolicitudDto {
  @IsInt() @Min(1)
  sedeId: number

  @IsEnum(TipoUsuarioParking)
  tipoUsuario: TipoUsuarioParking

  @IsEnum(TipoVehiculo)
  tipoVehiculo: TipoVehiculo

  @IsString() @IsNotEmpty() @MaxLength(10)
  placa: string

  // Datos mínimos del solicitante — la persona completa el resto en autogestión
  @IsOptional() @IsString() @MaxLength(200)
  solicitanteNombre?: string

  @IsOptional() @IsString() @MaxLength(20)
  solicitanteCedula?: string

  // Datos del vehículo — opcionales en creación, los completa la persona
  @IsOptional() @IsString() @MaxLength(50)
  marca?: string

  @IsOptional() @IsString() @MaxLength(50)
  linea?: string

  @IsOptional() @IsString() @MaxLength(30)
  color?: string

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  modeloAnio?: number

  @IsOptional() @IsString() @MaxLength(100)
  horarioRequerido?: string

  @IsOptional() @IsArray() @IsString({ each: true })
  diasRequeridos?: string[]

  @IsDateString()
  fechaInicio: string

  @IsDateString()
  fechaFin: string

  @IsOptional() @IsString()
  motivo?: string
}

// ── DTO que llena la persona en el portal de autogestión ──────────

export class CompletarAutogestionDto {
  @IsString() @IsNotEmpty() @MaxLength(50)
  marca: string

  @IsString() @IsNotEmpty() @MaxLength(50)
  linea: string

  @IsString() @IsNotEmpty() @MaxLength(30)
  color: string

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  @Type(() => Number)
  modeloAnio?: number

  @IsString() @IsNotEmpty() @MaxLength(100)
  horarioRequerido: string

  @IsOptional() @IsArray() @IsString({ each: true })
  diasRequeridos?: string[]

  @IsString() @IsNotEmpty()
  motivo: string

  // Datos personales confirmados por el solicitante
  @IsOptional() @IsString() @MaxLength(100)
  nombres?: string

  @IsOptional() @IsString() @MaxLength(100)
  apellidos?: string

  @IsOptional() @IsEmail()
  email?: string

  @IsOptional() @IsString() @MaxLength(20)
  telefono?: string
}

export class UpdateSolicitudDto {
  @IsOptional() @IsEnum(TipoVehiculo)
  tipoVehiculo?: TipoVehiculo

  @IsOptional() @IsString() @MaxLength(10)
  placa?: string

  @IsOptional() @IsString() @MaxLength(50)
  marca?: string

  @IsOptional() @IsString() @MaxLength(50)
  linea?: string

  @IsOptional() @IsString() @MaxLength(30)
  color?: string

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  modeloAnio?: number

  @IsOptional() @IsString() @MaxLength(100)
  horarioRequerido?: string

  @IsOptional() @IsArray() @IsString({ each: true })
  diasRequeridos?: string[]

  @IsOptional() @IsDateString()
  fechaInicio?: string

  @IsOptional() @IsDateString()
  fechaFin?: string

  @IsOptional() @IsString()
  motivo?: string
}

export class AprobarSolicitudDto {
  @IsEnum(TipoAutorizacion)
  tipoAutorizacion: TipoAutorizacion

  @IsOptional() @IsInt() @Min(1)
  cupoId?: number | null

  @IsOptional() @IsArray() @IsString({ each: true })
  diasPermitidos?: string[]

  @IsOptional() @IsString() @MaxLength(5)
  horarioInicio?: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioFin?: string

  @IsOptional() @IsString()
  observaciones?: string
}

export class DenegarSolicitudDto {
  @IsString() @IsNotEmpty()
  motivoDenegacion: string
}

export class SolicitarCorreccionDto {
  @IsString() @IsNotEmpty()
  observaciones: string
}

export class SuspenderSolicitudDto {
  @IsString() @IsNotEmpty()
  motivo: string
}

export class RegenerarTokenDto {
  @IsOptional() @IsInt() @Min(1) @Max(168)
  @Type(() => Number)
  duracionHoras?: number
}

export class ListarSolicitudesDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  sedeId?: number

  @IsOptional() @IsString()
  estado?: string

  @IsOptional() @IsString()
  tipoUsuario?: string

  @IsOptional() @IsString()
  tipoVehiculo?: string

  @IsOptional() @IsString()
  placa?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  personaId?: number

  @IsOptional() @IsDateString()
  fechaInicioDesde?: string

  @IsOptional() @IsDateString()
  fechaInicioHasta?: string

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number

  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  perPage?: number
}
