import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { GhMaestroDotacion } from './gh-maestro-dotacion.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhDotacionEntregaDetalle } from './gh-dotacion-entrega-detalle.entity';
import { GhDotacionEntregaEstado } from '../../common/enums/gh.enum';
export declare class GhDotacionEntrega extends BaseEntity {
    candidatoId: number;
    maestroDotacionId: number | null;
    sesionOCitaId: number | null;
    tipoReferencia: string | null;
    area: string | null;
    cargo: string | null;
    estadoEntrega: GhDotacionEntregaEstado;
    entregadoPorUsuarioId: number | null;
    fechaEntrega: Date | null;
    observaciones: string | null;
    candidato: GhCandidato;
    maestroDotacion: GhMaestroDotacion | null;
    entregador: Usuario | null;
    detalles: GhDotacionEntregaDetalle[];
}
