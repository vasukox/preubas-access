import { BaseEntity } from '../../common/entities/base.entity';
import { HseCumplimiento } from './hse-cumplimiento.entity';
export declare class HseCumplimientoItem extends BaseEntity {
    cumplimientoId: number;
    pregunta: string;
    aplica: boolean;
    cumple: boolean;
    observacion: string;
    orden: number;
    cumplimiento: HseCumplimiento;
}
