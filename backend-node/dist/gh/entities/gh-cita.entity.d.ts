import { BaseEntity } from '../../common/entities/base.entity';
import { GhCandidato } from './gh-candidato.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhPortalToken } from './gh-portal-token.entity';
import { GhTipoCita, GhEstadoCita } from '../../common/enums/gh.enum';
export declare class GhCita extends BaseEntity {
    codigo: string;
    candidatoId: number;
    sedeId: number;
    responsableId: number;
    tipoCita: GhTipoCita;
    estado: GhEstadoCita;
    fechaHoraInicio: Date;
    fechaHoraFin: Date;
    observaciones: string;
    candidato: GhCandidato;
    sede: Sede;
    responsable: Usuario;
    tokensPortal: GhPortalToken[];
}
