import { BaseEntity } from '../../common/entities/base.entity';
import { HseCumplimiento } from './hse-cumplimiento.entity';
export declare class HseCumplimientoItem extends BaseEntity {
    cumplimientoId: number;
    requisitoCodigo: string;
    esCumplido: boolean;
    observacion: string;
    cumplimiento: HseCumplimiento;
}
