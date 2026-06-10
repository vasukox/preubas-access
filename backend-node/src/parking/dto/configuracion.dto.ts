import {
  IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class UpdatePoliticaDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  maxVehiculosPorPersona?: number

  @IsOptional() @IsBoolean()
  requiereSoat?: boolean

  @IsOptional() @IsBoolean()
  requiereTecnomecanica?: boolean

  @IsOptional() @IsBoolean()
  requiereLicencia?: boolean

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  diasAlertaVencimientoDocs?: number

  @IsOptional() @IsBoolean()
  permiteVehiculoReemplazo?: boolean

  @IsOptional() @IsBoolean()
  permiteEntradaUnicaVisitantes?: boolean

  @IsOptional() @IsBoolean()
  requiereAprobacionJefe?: boolean

  @IsOptional() @IsString() @MaxLength(5)
  horarioInicioOperacion?: string

  @IsOptional() @IsString() @MaxLength(5)
  horarioFinOperacion?: string
}
