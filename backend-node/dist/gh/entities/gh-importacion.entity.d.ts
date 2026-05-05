import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { GhImportacionDetalle } from './gh-importacion-detalle.entity';
import { GhImportacionEstado } from '../../common/enums/gh.enum';
export declare class GhImportacion extends BaseEntity {
    sedeId: number;
    creadoPor: number;
    nombreArchivo: string;
    estado: GhImportacionEstado;
    filasTotales: number;
    filasExitosas: number;
    filasFallidas: number;
    resumenError: string;
    sede: Sede;
    creador: Usuario;
    detalles: GhImportacionDetalle[];
}
