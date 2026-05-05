/**
 * Enums del módulo HSE.
 *
 * Equivalentes a los enums definidos en Python (app/models/hse.py).
 * Todos deben coincidir exactamente con los valores ENUM de MySQL.
 */

export enum TipoContratista {
  ALTO_RIESGO = 'ALTO_RIESGO',
  NORMAL = 'NORMAL',
}

export enum EstadoAutorizacion {
  BORRADOR = 'BORRADOR',
  PENDIENTE_AUTOGESTION = 'PENDIENTE_AUTOGESTION',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  DENEGADO = 'DENEGADO',
  VENCIDO = 'VENCIDO',
}

export enum EstadoContratista {
  PENDIENTE_AUTOGESTION = 'PENDIENTE_AUTOGESTION',
  AUTOGESTION_EN_PROGRESO = 'AUTOGESTION_EN_PROGRESO',
  AUTOGESTION_COMPLETADA = 'AUTOGESTION_COMPLETADA',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  DENEGADO = 'DENEGADO',
}

export enum TipoDocumento {
  CC = 'CC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
  TI = 'TI',
}

export enum AlturasNivel {
  BASICO = 'BASICO',
  AVANZADO = 'AVANZADO',
  COORDINADOR = 'COORDINADOR',
}

export enum ConfinadosRol {
  SUPERVISOR = 'SUPERVISOR',
  VIGIA = 'VIGIA',
  ENTRANTE = 'ENTRANTE',
}

export enum ElectricoMatricula {
  TE1 = 'TE1',
  TE2 = 'TE2',
  TE3 = 'TE3',
  TE4 = 'TE4',
  TE5 = 'TE5',
  TE6 = 'TE6',
}

export enum PilaTipo {
  INTEGRADA = 'INTEGRADA',
  MANUAL = 'MANUAL',
  NO_APLICA = 'NO_APLICA',
}

export enum PilaEstado {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
}

export enum PermisoTipo {
  ALTURAS = 'ALTURAS',
  CONFINADOS = 'CONFINADOS',
  CALIENTE = 'CALIENTE',
  ELECTRICO = 'ELECTRICO',
  GENERAL = 'GENERAL',
}

export enum ConceptoMedico {
  APTO = 'APTO',
  APTO_CON_RESTRICCION = 'APTO_CON_RESTRICCION',
  NO_APTO = 'NO_APTO',
  PENDIENTE = 'PENDIENTE',
}

export enum RelacionEmergencia {
  FAMILIAR = 'FAMILIAR',
  CONYUGE = 'CONYUGE',
  COLEGA = 'COLEGA',
  OTRO = 'OTRO',
}

export enum RhSanguineo {
  A_POS = 'A_POS',
  A_NEG = 'A_NEG',
  B_POS = 'B_POS',
  B_NEG = 'B_NEG',
  AB_POS = 'AB_POS',
  AB_NEG = 'AB_NEG',
  O_POS = 'O_POS',
  O_NEG = 'O_NEG',
}

export enum MetodoAcceso {
  CEDULA_MANUAL = 'CEDULA_MANUAL',
  LECTOR_USB = 'LECTOR_USB',
  MANUAL_VIGILANTE = 'MANUAL_VIGILANTE',
}

export enum TipoAcceso {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export enum CumplimientoEstado {
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
  INCUMPLIMIENTO = 'INCUMPLIMIENTO',
}

export enum RiesgoClasificacion {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
}

export enum ModalidadTrabajo {
  PRESENCIAL = 'PRESENCIAL',
  REMOTO = 'REMOTO',
  HIBRIDO = 'HIBRIDO',
}