import { BaseEntity } from '../../common/entities/base.entity';
import { GhSesionInduccion } from './gh-sesion-induccion.entity';
import { GhCandidato } from './gh-candidato.entity';
import { GhEstadoAsistenciaInduccion } from '../../common/enums/gh.enum';
export declare class GhInduccionAsistencia extends BaseEntity {
    sesionId: number;
    candidatoId: number;
    tokenAutogestion: string;
    estadoAsistencia: GhEstadoAsistenciaInduccion;
    checkinAt: Date;
    checkoutAt: Date;
    intentosCodigo: number;
    ultimoErrorCodigo: string;
    ipEntrada: string;
    userAgentEntrada: string;
    ipSalida: string;
    userAgentSalida: string;
    sesion: GhSesionInduccion;
    candidato: GhCandidato;
}
