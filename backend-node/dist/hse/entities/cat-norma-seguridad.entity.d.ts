import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
export declare class CatNormaSeguridad extends BaseEntity {
    numero: number;
    titulo: string;
    contenido: string;
    activa: boolean;
    sedeId: number;
    sede: Sede;
}
