import { BaseEntity } from '../../common/entities/base.entity';
import { RolNombre } from '../../common/enums/rol.enum';
import { UsuarioRol } from './usuario-rol.entity';
export declare class Rol extends BaseEntity {
    nombre: RolNombre;
    descripcion: string;
    activo: boolean;
    usuarioRoles: UsuarioRol[];
}
