import { BaseEntity } from '../../common/entities/base.entity';
import { GhImportacion } from './gh-importacion.entity';
export declare class GhImportacionDetalle extends BaseEntity {
    importacionId: number;
    numeroFila: number;
    estado: string;
    mensaje: string;
    payload: Record<string, any>;
    importacion: GhImportacion;
}
