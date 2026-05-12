import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
export declare class HseHistorial extends BaseEntity {
    contratistaId: number;
    usuarioId: number | null;
    estadoAnterior: string | null;
    estadoNuevo: string;
    motivo: string | null;
    metadataExtra: object | null;
    contratista: HseContratista;
    usuario: Usuario;
}
