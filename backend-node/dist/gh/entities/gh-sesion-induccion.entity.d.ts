import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhInduccionAsistencia } from './gh-induccion-asistencia.entity';
import { GhEstadoSesionInduccion, GhTipoSesion } from '../../common/enums/gh.enum';
export declare class GhSesionInduccion extends BaseEntity {
    sedeId: number;
    area: string;
    tipoInduccion: string;
    tipoSesion: GhTipoSesion;
    linkVirtual: string;
    salaFisica: string;
    descripcion: string;
    capacidadMaxima: number;
    responsableUsuarioId: number;
    fechaHoraInicio: Date;
    fechaHoraFin: Date;
    estadoSesion: GhEstadoSesionInduccion;
    codigoCheckinActual: string;
    codigoCheckoutActual: string;
    fechaCierre: Date;
    sede: Sede;
    responsable: Usuario;
    asistentes: GhInduccionAsistencia[];
}
