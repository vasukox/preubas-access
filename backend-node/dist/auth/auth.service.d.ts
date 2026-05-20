import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ConfigService } from '../config/config.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    tokenType: 'bearer';
    expiresIn: number;
}
export interface LoginResponse {
    tokens: {
        accessToken: string;
        refreshToken: string;
        tokenType: 'bearer';
        debeCambiarPassword: boolean;
    };
    usuario: {
        id: number;
        email: string;
        nombreCompleto: string;
        activo: boolean;
        debeCambiarPassword: boolean;
        ultimoLogin: Date | null;
        roles: {
            id: number;
            nombre: string;
        }[];
        sedeAsignadaId: number | null;
        sedeAsignada: {
            id: number;
            nombre: string;
            ciudad?: string;
        } | null;
        sedesAsignadasIds: number[];
        sedesAsignadas: {
            id: number;
            nombre: string;
            ciudad?: string;
        }[];
    };
}
export declare class AuthService {
    private readonly usuarioRepo;
    private readonly refreshTokenRepo;
    private readonly auditLogRepo;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(usuarioRepo: Repository<Usuario>, refreshTokenRepo: Repository<RefreshToken>, auditLogRepo: Repository<AuditLog>, jwtService: JwtService, configService: ConfigService);
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse>;
    refreshTokens(rawRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair>;
    logout(usuarioId: number): Promise<void>;
    findByIdWithRolesAndPermisos(id: number): Promise<Usuario | null>;
    changePassword(usuarioId: number, dto: ChangePasswordDto): Promise<void>;
    private generarTokens;
    private findUsuarioConRelaciones;
    private registrarIntentoFallido;
    private registrarAudit;
}
