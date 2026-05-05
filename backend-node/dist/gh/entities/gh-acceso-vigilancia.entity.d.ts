import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhTipoAcceso } from '../../common/enums/gh.enum';
export declare class GhAccesoVigilancia extends BaseEntity {
    citaId: number;
    sedeId: number;
    vigilanteId: number;
    tipoAcceso: GhTipoAcceso;
    metodo: string;
    notas: string;
    cita: GhCita;
    sede: Sede;
    vigilante: Usuario;
}
