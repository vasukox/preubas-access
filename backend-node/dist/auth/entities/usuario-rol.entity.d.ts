import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
export declare class UsuarioRol extends BaseEntity {
    usuarioId: number;
    rolId: number;
    asignadoPor: number;
    usuario: Usuario;
    rol: Rol;
}
