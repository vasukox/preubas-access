import { Repository } from 'typeorm';
import { Rol } from '../auth/entities/rol.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { UsuarioSede } from '../auth/entities/usuario-sede.entity';
import { Perfil } from '../auth/entities/perfil.entity';
import { UsuarioPermiso } from '../auth/entities/usuario-permiso.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';
import { Sede } from '../sede/entities/sede.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';
import { RolNombre } from '../common/enums/rol.enum';
export declare class HerramientasService {
    private readonly rolRepo;
    private readonly usuarioRepo;
    private readonly auditLogRepo;
    private readonly perfilRepo;
    private readonly usuarioPermisoRepo;
    private readonly usuarioRolRepo;
    private readonly usuarioSedeRepo;
    private readonly sedeRepo;
    constructor(rolRepo: Repository<Rol>, usuarioRepo: Repository<Usuario>, auditLogRepo: Repository<AuditLog>, perfilRepo: Repository<Perfil>, usuarioPermisoRepo: Repository<UsuarioPermiso>, usuarioRolRepo: Repository<UsuarioRol>, usuarioSedeRepo: Repository<UsuarioSede>, sedeRepo: Repository<Sede>);
    private validarPasswordFuerte;
    private resolverIdsSedes;
    private mapSedesAsignadas;
    private mapUsuarioResponse;
    private validarSedesExisten;
    private sincronizarSedesUsuario;
    private assertEmailDisponible;
    private normalizarFirma;
    private registrarAuditoria;
    listarRoles(): Promise<{
        id: number;
        nombre: RolNombre;
        descripcion: any;
        color: any;
        modulos: any;
        grupos: any;
    }[]>;
    listarUsuarios(): Promise<{
        id: number;
        email: string;
        nombreCompleto: string;
        numero: string;
        direccion: string;
        activo: boolean;
        ultimoLogin: Date | null;
        roles: {
            id: number;
            nombre: RolNombre;
        }[];
        permisos: {
            puedeVer: boolean;
            puedeCrear: boolean;
            puedeEditar: boolean;
            puedeEliminar: boolean;
        };
        sedeAsignadaId: number;
        sedeAsignada: {
            id: number;
            nombre: string;
            ciudad: string;
        };
        sedesAsignadasIds: number[];
        sedesAsignadas: {
            id: number;
            nombre: string;
            ciudad: string;
        }[];
    }[]>;
    listarAuditoria(limite?: number): Promise<AuditLog[]>;
    crearUsuario(dto: CreateUsuarioDto, currentUserId: number, currentUserName: string): Promise<{
        id: number;
        email: string;
        nombreCompleto: string;
        numero: string;
        direccion: string;
        activo: boolean;
        ultimoLogin: Date | null;
        roles: {
            id: number;
            nombre: RolNombre;
        }[];
        permisos: {
            puedeVer: boolean;
            puedeCrear: boolean;
            puedeEditar: boolean;
            puedeEliminar: boolean;
        };
        sedeAsignadaId: number;
        sedeAsignada: {
            id: number;
            nombre: string;
            ciudad: string;
        };
        sedesAsignadasIds: number[];
        sedesAsignadas: {
            id: number;
            nombre: string;
            ciudad: string;
        }[];
    }>;
    actualizarUsuario(id: number, dto: UpdateUsuarioDto, currentUserId: number, currentUserName: string): Promise<Usuario | null>;
    eliminarUsuario(id: number, currentUserId: number, currentUserName: string): Promise<{
        success: boolean;
    }>;
    actualizarPermisos(id: number, dto: UpdatePermisosDto, currentUserId: number, currentUserName: string): Promise<Usuario | null>;
    asignarRol(id: number, rolNombre: string, currentUserId: number, currentUserName: string, sedeAsignadaId?: number, sedesAsignadasIds?: number[]): Promise<{
        id: number;
        email: string;
        nombreCompleto: string;
        numero: string;
        direccion: string;
        activo: boolean;
        ultimoLogin: Date | null;
        roles: {
            id: number;
            nombre: RolNombre;
        }[];
        permisos: {
            puedeVer: boolean;
            puedeCrear: boolean;
            puedeEditar: boolean;
            puedeEliminar: boolean;
        };
        sedeAsignadaId: number;
        sedeAsignada: {
            id: number;
            nombre: string;
            ciudad: string;
        };
        sedesAsignadasIds: number[];
        sedesAsignadas: {
            id: number;
            nombre: string;
            ciudad: string;
        }[];
    }>;
    quitarRol(id: number, rolNombre: string, currentUserId: number, currentUserName: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
