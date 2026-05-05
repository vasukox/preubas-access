import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhDotacionEntregaDetalle } from './gh-dotacion-entrega-detalle.entity';
import { GhDotacionEntregaEstado } from '../../common/enums/gh.enum';
export declare class GhDotacionEntrega extends BaseEntity {
    candidatoId: number;
    sesionOCitaId: number;
    tipoReferencia: string;
    estadoEntrega: GhDotacionEntregaEstado;
    entregadoPorUsuarioId: number;
    fechaEntrega: Date;
    observaciones: string;
    candidato: GhCandidato;
    entregador: Usuario;
    detalles: GhDotacionEntregaDetalle[];
}
