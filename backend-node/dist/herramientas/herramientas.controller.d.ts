import { Request } from 'express';
import { HerramientasService } from './herramientas.service';
import { RolNombre } from '../common/enums/rol.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';
import { AsignarRolDto } from './dto/asignar-rol.dto';
export declare class HerramientasController {
    private readonly herramientasService;
    constructor(herramientasService: HerramientasService);
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
    crearUsuario(dto: CreateUsuarioDto, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<{
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
    actualizarUsuario(id: number, dto: UpdateUsuarioDto, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<import("../auth/entities/usuario.entity").Usuario | null>;
    eliminarUsuario(id: number, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<{
        message: string;
    }>;
    listarAuditoria(limite: number): Promise<import("../auth/entities/audit-log.entity").AuditLog[]>;
    actualizarPermisos(id: number, dto: UpdatePermisosDto, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<import("../auth/entities/usuario.entity").Usuario | null>;
    asignarRol(id: number, dto: AsignarRolDto, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<{
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
    quitarRol(id: number, rolNombre: string, req: Request & {
        user: {
            id: number;
            email: string;
            nombreCompleto?: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
