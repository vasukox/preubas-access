import { BaseEntity } from '../../common/entities/base.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { UsuarioRol } from './usuario-rol.entity';
import { RefreshToken } from './refresh-token.entity';
import { Perfil } from './perfil.entity';
import { UsuarioPermiso } from './usuario-permiso.entity';
export declare class Usuario extends BaseEntity {
    email: string;
    passwordHash: string;
    nombreCompleto: string;
    activo: boolean;
    debeCambiarPassword: boolean;
    ultimoLogin: Date | null;
    intentosFallidos: number;
    bloqueadoHasta: Date | null;
    sedeAsignadaId: number | null;
    sedeAsignada: Sede;
    roles: UsuarioRol[];
    refreshTokens: RefreshToken[];
    perfil: Perfil;
    permisos: UsuarioPermiso;
}
