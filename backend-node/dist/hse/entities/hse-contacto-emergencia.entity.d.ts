import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { RelacionEmergencia, RhSanguineo } from '../../common/enums/hse.enum';
export declare class HseContactoEmergencia extends BaseEntity {
    contratistaId: number;
    nombreCompleto: string;
    relacion: RelacionEmergencia;
    relacionOtro: string;
    telefonoCelular: string;
    telefonoFijo: string;
    rhSanguineo: RhSanguineo;
    alergias: string;
    condicionMedica: string;
    epsContratista: string;
    contratista: HseContratista;
}
