import { IsString, IsBoolean, IsEnum, IsOptional, IsInt, IsDateString, IsArray } from 'class-validator';
import {
  AlturasNivel, ConfinadosRol, ElectricoMatricula,
  PilaTipo, PilaEstado, PermisoTipo, ConceptoMedico,
  RelacionEmergencia, RhSanguineo,
} from '../../common/enums/hse.enum';

export class ClasificacionDto {
  @IsOptional() @IsBoolean() trabajoAlturas?: boolean;
  @IsOptional() @IsBoolean() espaciosConfinados?: boolean;
  @IsOptional() @IsBoolean() trabajoElectrico?: boolean;
  @IsOptional() @IsBoolean() trabajoCaliente?: boolean;
  @IsOptional() @IsBoolean() izajeMaquinaria?: boolean;
  @IsOptional() @IsBoolean() visitaSinRiesgo?: boolean;
  @IsOptional() @IsBoolean() personalExtranjero?: boolean;
  @IsOptional() @IsBoolean() generaResiduos?: boolean;

  @IsOptional() @IsEnum(AlturasNivel) alturasNivel?: AlturasNivel;
  @IsOptional() @IsDateString() alturasCertFechaVenc?: string;
  @IsOptional() @IsString() alturasCertArchivo?: string;

  @IsOptional() @IsEnum(ConfinadosRol) confinadosRol?: ConfinadosRol;
  @IsOptional() @IsDateString() confinadosCertFecha?: string;
  @IsOptional() @IsString() confinadosCertArchivo?: string;

  @IsOptional() @IsEnum(ElectricoMatricula) electricoMatriculaContec?: ElectricoMatricula;
  @IsOptional() @IsString() electricoNumMatricula?: string;
  @IsOptional() @IsDateString() electricoMatriculaVenc?: string;
  @IsOptional() @IsString() electricoMatriculaArchivo?: string;

  @IsOptional() @IsDateString() calienteExtintorFecha?: string;
  @IsOptional() @IsString() calienteExtintorArchivo?: string;
  @IsOptional() @IsDateString() calientePermisoFecha?: string;
  @IsOptional() @IsString() calientePermisoArchivo?: string;

  @IsOptional() @IsString() izajeTipoEquipo?: string;
  @IsOptional() @IsString() izajeInspeccionArchivo?: string;
  @IsOptional() @IsString() izajeDocLegalArchivo?: string;
  @IsOptional() @IsString() izajeLicenciaArchivo?: string;

  @IsOptional() @IsString() extranAseguradora?: string;
  @IsOptional() @IsString() extranNumPoliza?: string;
  @IsOptional() @IsDateString() extranPolizaVenc?: string;
  @IsOptional() @IsString() extranPolizaArchivo?: string;

  @IsOptional() @IsString() residuosTipo?: string;
  @IsOptional() @IsString() residuosPlanArchivo?: string;
}

export class SegSocialItemDto {
  @IsOptional() @IsBoolean() esTitular?: boolean;
  @IsOptional() @IsString() nombrePersona?: string;
  @IsOptional() @IsString() cedulaPersona?: string;

  @IsOptional() @IsInt() epsId?: number;
  @IsOptional() @IsDateString() epsVigencia?: string;

  @IsOptional() @IsInt() arlId?: number;
  @IsOptional() @IsDateString() arlVigencia?: string;

  @IsOptional() @IsInt() afpId?: number;
  @IsOptional() @IsDateString() afpVigencia?: string;

  @IsOptional() @IsEnum(PilaTipo) pilaTipo?: PilaTipo;
  @IsOptional() @IsEnum(PilaEstado) pilaEstado?: PilaEstado;
  @IsOptional() @IsString() pilaArchivo?: string;

  @IsOptional() @IsBoolean() sstTieneVigente?: boolean;
  @IsOptional() @IsString() sstResponsableNombre?: string;
  @IsOptional() @IsString() sstResolucionRegistro?: string;
}

export class CertificacionesDto {
  @IsOptional() @IsString() artDescripcionTarea?: string;
  @IsOptional() @IsString() artArchivo?: string;
  @IsOptional() @IsEnum(PermisoTipo) permisoTipo?: PermisoTipo;
  @IsOptional() @IsDateString() permisoFecha?: string;
  @IsOptional() @IsString() permisoArchivo?: string;
}

export class ExamenMedicoDto {
  @IsOptional() @IsDateString() fechaExamen?: string;
  @IsOptional() @IsEnum(ConceptoMedico) concepto?: ConceptoMedico;
  @IsOptional() @IsString() descripcionRestriccion?: string;
  @IsOptional() @IsString() archivo?: string;
}

export class ContactoEmergenciaDto {
  @IsString() nombreCompleto: string;
  @IsEnum(RelacionEmergencia) relacion: RelacionEmergencia;
  @IsOptional() @IsString() relacionOtro?: string;
  @IsString() telefonoCelular: string;
  @IsOptional() @IsString() telefonoFijo?: string;
  @IsOptional() @IsEnum(RhSanguineo) rhSanguineo?: RhSanguineo;
  @IsOptional() @IsString() alergias?: string;
  @IsOptional() @IsString() condicionMedica?: string;
  @IsOptional() @IsString() epsContratista?: string;
}

export class AceptacionNormasDto {
  @IsBoolean() aceptoNormas: boolean;
  @IsBoolean() aceptoDatos: boolean;
  @IsString() firmaDigital: string;
  @IsOptional() @IsString() ipAddress?: string;
}

export class SegSocialRequestDto {
  @IsOptional()
  @IsArray()
  personas?: SegSocialItemDto[];
}
