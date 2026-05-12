import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
export declare class HseAceptacionNormas extends BaseEntity {
    contratistaId: number;
    aceptoNormas: boolean;
    aceptoDatos: boolean;
    firmaDigital: string;
    fechaAceptacion: Date;
    ipAddress: string;
    contratista: HseContratista;
}
