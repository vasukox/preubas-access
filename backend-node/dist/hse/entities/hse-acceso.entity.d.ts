import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Ubicacion } from '../../sede/entities/ubicacion.entity';
import { MetodoAcceso } from '../../common/enums/hse.enum';
export declare class HseAcceso extends BaseEntity {
    contratistaId: number;
    sedeId: number;
    registradoPor: number;
    tipoAcceso: string;
    metodo: MetodoAcceso;
    ubicacionId: number;
    observacion: string;
    fechaHora: Date;
    contratista: HseContratista;
    sede: Sede;
    usuarioRegistro: Usuario;
    ubicacion: Ubicacion;
}
