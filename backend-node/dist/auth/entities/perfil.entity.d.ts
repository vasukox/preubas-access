import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
export declare class Perfil extends BaseEntity {
    usuarioId: number;
    fotoPerfil: string;
    biografia: string;
    ubicacion: string;
    telefono: string;
    sedeDefaultId: number;
    tema: string;
    notificacionesEmail: boolean;
    usuario: Usuario;
}
