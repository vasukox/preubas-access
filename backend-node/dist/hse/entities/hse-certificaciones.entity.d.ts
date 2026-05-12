import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { PermisoTipo } from '../../common/enums/hse.enum';
export declare class HseCertificaciones extends BaseEntity {
    contratistaId: number;
    artDescripcionTarea: string;
    artArchivo: string;
    permisoTipo: PermisoTipo;
    permisoFecha: Date;
    permisoArchivo: string;
    contratista: HseContratista;
}
