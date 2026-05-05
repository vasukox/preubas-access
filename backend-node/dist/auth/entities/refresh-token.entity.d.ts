import { BaseEntity } from '../../common/entities/base.entity';
import { Usuario } from './usuario.entity';
export declare class RefreshToken extends BaseEntity {
    usuarioId: number;
    jti: string;
    revocado: boolean;
    expiraEn: Date;
    userAgent: string;
    ipAddress: string;
    usuario: Usuario;
}
