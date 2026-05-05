import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';
export declare class HseExcepcion extends BaseEntity {
    contratistaId: number;
    autorizadorId: number;
    sedeId: number;
    motivoExcepcion: string;
    fechaValidezInicio: Date;
    fechaValidezFin: Date;
    esActiva: boolean;
    contratista: HseContratista;
    autorizador: Usuario;
    sede: Sede;
}
