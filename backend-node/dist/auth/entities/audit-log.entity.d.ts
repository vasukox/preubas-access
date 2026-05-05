import { BaseEntity } from '../../common/entities/base.entity';
export declare class AuditLog extends BaseEntity {
    actorId: number;
    actorNombre: string;
    accion: string;
    entidad: string;
    entidadId: number;
    descripcion: string;
}
