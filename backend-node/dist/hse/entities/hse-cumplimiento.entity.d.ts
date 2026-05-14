import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { HseCumplimientoItem } from './hse-cumplimiento-item.entity';
import { CumplimientoEstado } from '../../common/enums/hse.enum';
export declare class HseCumplimiento extends BaseEntity {
    contratistaId: number;
    sedeId: number;
    encargadoId: number;
    estado: CumplimientoEstado;
    observacionGeneral: string;
    fechaInicio: Date;
    fechaCierre: Date;
    firmaDigital: string;
    contratista: HseContratista;
    encargado: Usuario;
    sede: Sede;
    archivado: boolean;
    items: HseCumplimientoItem[];
}
