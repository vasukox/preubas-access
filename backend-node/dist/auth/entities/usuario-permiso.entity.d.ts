import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
export declare class UsuarioPermiso extends BaseEntity {
    usuarioId: number;
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    asignadoPor: number;
    usuario: Usuario;
}
