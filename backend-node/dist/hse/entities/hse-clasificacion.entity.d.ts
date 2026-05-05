import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { RiesgoClasificacion, ModalidadTrabajo } from '../../common/enums/hse.enum';
export declare class HseClasificacion extends BaseEntity {
    contratistaId: number;
    riesgo: RiesgoClasificacion;
    modalidadTrabajo: ModalidadTrabajo;
    cargoActividad: string;
    requiereTrabajoAltura: boolean;
    requiereEspaciosConfinados: boolean;
    requiereEnergiasPeligrosas: boolean;
    requiereCaliente: boolean;
    requiereQuimicos: boolean;
    contratista: HseContratista;
}
