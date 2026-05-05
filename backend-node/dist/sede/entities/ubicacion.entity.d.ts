import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from './sede.entity';
export declare class Ubicacion extends BaseEntity {
    sedeId: number;
    nombre: string;
    codigo: string;
    tipo: string;
    activa: boolean;
    descripcion: string;
    sede: Sede;
}
