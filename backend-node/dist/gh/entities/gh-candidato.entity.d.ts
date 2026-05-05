import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';
import { GhInduccionAsistencia } from './gh-induccion-asistencia.entity';
import { GhDotacionEntrega } from './gh-dotacion-entrega.entity';
export declare class GhCandidato extends BaseEntity {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    citas: GhCita[];
    asistenciasInduccion: GhInduccionAsistencia[];
    dotacionEntregas: GhDotacionEntrega[];
}
