import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { EstadoContratista } from '../../common/enums/hse.enum';
export declare class HseHistorial extends BaseEntity {
    contratistaId: number;
    estadoAnterior: EstadoContratista;
    estadoNuevo: EstadoContratista;
    motivo: string;
    cambiadoPor: number;
    contratista: HseContratista;
    usuario: Usuario;
}
