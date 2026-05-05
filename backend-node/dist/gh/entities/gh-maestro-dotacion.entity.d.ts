import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
export declare class GhMaestroDotacion extends BaseEntity {
    sedeId: number;
    area: string;
    cargo: string;
    tipoContrato: string;
    kitCodigo: string;
    kitDescripcion: string;
    activo: boolean;
    sede: Sede;
}
