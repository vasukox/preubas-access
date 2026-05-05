import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '../../config/config.service';
import { Usuario } from '../entities/usuario.entity';
interface JwtPayload {
    sub: number;
    email: string;
    roles: string[];
    dcp: boolean;
    iat?: number;
    exp?: number;
}
export interface UsuarioConPermisos {
    id: number;
    email: string;
    roles: string[];
    debeCambiarPassword: boolean;
    permisos?: {
        puedeVer: boolean;
        puedeCrear: boolean;
        puedeEditar: boolean;
        puedeEliminar: boolean;
    };
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usuarioRepo;
    constructor(configService: ConfigService, usuarioRepo: Repository<Usuario>);
    validate(payload: JwtPayload): Promise<UsuarioConPermisos>;
}
export {};
