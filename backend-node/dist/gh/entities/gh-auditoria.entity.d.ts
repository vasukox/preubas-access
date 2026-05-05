import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';
export declare class GhAuditoria extends BaseEntity {
    usuarioId: number;
    sedeId: number;
    accion: string;
    entidad: string;
    entidadId: number;
    detalle: Record<string, any>;
    usuario: Usuario;
    sede: Sede;
}
