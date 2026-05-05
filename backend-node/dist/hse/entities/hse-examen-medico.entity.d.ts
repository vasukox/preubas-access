import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
export declare class HseExamenMedico extends BaseEntity {
    contratistaId: number;
    urlCertificadoAptitud: string;
    fechaEmision: Date;
    aptoConRestricciones: boolean;
    restricciones: string;
    contratista: HseContratista;
}
