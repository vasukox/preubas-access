import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { ConceptoMedico } from '../../common/enums/hse.enum';
export declare class HseExamenMedico extends BaseEntity {
    contratistaId: number;
    fechaExamen: Date;
    concepto: ConceptoMedico;
    descripcionRestriccion: string;
    archivo: string;
    contratista: HseContratista;
}
