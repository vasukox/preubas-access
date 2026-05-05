import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { HseCumplimientoItem } from './hse-cumplimiento-item.entity';
import { CumplimientoEstado } from '../../common/enums/hse.enum';
export declare class HseCumplimiento extends BaseEntity {
    contratistaId: number;
    evaluadorId: number;
    estado: CumplimientoEstado;
    porcentajeCumplimiento: number;
    fechaEvaluacion: Date;
    observacionesGenerales: string;
    contratista: HseContratista;
    evaluador: Usuario;
    items: HseCumplimientoItem[];
}
