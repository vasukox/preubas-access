import { BaseEntity } from '../../common/entities/base.entity';
import { GhDotacionEntrega } from './gh-dotacion-entrega.entity';
import { GhDotacionItemEstado } from '../../common/enums/gh.enum';
export declare class GhDotacionEntregaDetalle extends BaseEntity {
    entregaId: number;
    itemCodigo: string;
    itemNombre: string;
    cantidadEsperada: number;
    cantidadEntregada: number;
    estadoItem: GhDotacionItemEstado;
    evidenciaUrl: string;
    entrega: GhDotacionEntrega;
}
