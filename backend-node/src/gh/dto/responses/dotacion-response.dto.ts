import { GhDotacionEntregaEstado, GhDotacionItemEstado } from '../../../common/enums/gh.enum';

export class MaestroDotacionResponseDto {
  id: number;
  sedeId: number | null;
  area: string;
  cargo: string;
  tipoContrato: string;
  kitCodigo: string;
  kitDescripcion: string;
  activo: boolean;
}

export class DotacionEntregaDetalleResponseDto {
  id: number;
  itemCodigo: string;
  itemNombre: string;
  cantidadEsperada: number;
  cantidadEntregada: number;
  estadoItem: GhDotacionItemEstado;
  evidenciaUrl: string | null;
}

export class DotacionEntregaCandidatoDto {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
}

export class DotacionEntregaMaestroDto {
  id: number;
  kitCodigo: string;
  kitDescripcion: string;
  area: string;
  cargo: string;
  tipoContrato: string;
}

export class DotacionEntregaResponseDto {
  id: number;
  candidatoId: number;
  candidato: DotacionEntregaCandidatoDto | null;
  maestroDotacionId: number | null;
  maestroDotacion: DotacionEntregaMaestroDto | null;
  sesionOCitaId: number | null;
  tipoReferencia: string | null;
  area: string | null;
  cargo: string | null;
  estadoEntrega: GhDotacionEntregaEstado;
  entregadoPorUsuarioId: number | null;
  entregadorNombre: string | null;
  fechaEntrega: string | null;
  fechaCreacion: string;
  observaciones: string | null;
  detalles: DotacionEntregaDetalleResponseDto[];
  totalItems: number;
  itemsEntregados: number;
  porcentajeCompletitud: number;
}

export class ImportacionResponseDto {
  id: number;
  sedeId: number;
  nombreArchivo: string;
  estado: string;
  filasTotales: number;
  filasExitosas: number;
  filasFallidas: number;
  resumenError: string | null;
}

export class ImportacionDetalleItemDto {
  id: number;
  numeroFila: number;
  estado: string;
  mensaje: string;
  payload: Record<string, unknown> | null;
}

export class ImportacionDetalleResponseDto extends ImportacionResponseDto {
  detalles: ImportacionDetalleItemDto[];
}
