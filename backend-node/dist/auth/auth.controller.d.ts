import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RolNombre } from '../common/enums/rol.enum';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<import("./auth.service").LoginResponse>;
    refresh(dto: RefreshTokenDto, req: Request): Promise<import("./auth.service").TokenPair>;
    logout(req: Request & {
        user: {
            id: number;
        };
    }): Promise<{
        message: string;
    }>;
    getMe(req: Request & {
        user: {
            id: number;
        };
    }): Promise<{
        sedeAsignadaId: number | null;
        sedeAsignada: {
            id: number;
            nombre: string;
        } | null;
        sedesAsignadasIds: number[];
        sedesAsignadas: {
            id: number;
            nombre: string;
            ciudad: string;
        }[];
        perfil: {
            fotoPerfil: string;
            biografia: string;
            telefono: string;
            tema: string;
            notificacionesEmail: boolean;
        } | null;
        permisos: {
            puedeVer: boolean;
            puedeCrear: boolean;
            puedeEditar: boolean;
            puedeEliminar: boolean;
        } | null;
        id: number;
        email: string;
        nombreCompleto: string;
        activo: boolean;
        debeCambiarPassword: boolean;
        ultimoLogin: Date | null;
        roles: {
            id: number;
            nombre: RolNombre;
        }[];
    }>;
    changePassword(dto: ChangePasswordDto, req: Request & {
        user: {
            id: number;
        };
    }): Promise<{
        message: string;
    }>;
    private getClientIp;
}
