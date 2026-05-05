import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
export declare class HseAcceso extends BaseEntity {
    contratistaId: number;
    sedeId: number;
    registradoPor: number;
    tipoAcceso: string;
    fechaHora: Date;
    puerta: string;
    observaciones: string;
    contratista: HseContratista;
    sede: Sede;
    usuarioRegistro: Usuario;
}
