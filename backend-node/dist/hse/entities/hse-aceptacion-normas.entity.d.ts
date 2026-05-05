import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
export declare class HseAceptacionNormas extends BaseEntity {
    contratistaId: number;
    aceptaPoliticasSst: boolean;
    aceptaTratamientoDatos: boolean;
    fechaAceptacion: Date;
    ipAceptacion: string;
    firmaDigitalHash: string;
    contratista: HseContratista;
}
