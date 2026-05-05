import { BaseEntity } from '../../common/entities/base.entity';
import { GhCita } from './gh-cita.entity';
export declare class GhPortalToken extends BaseEntity {
    citaId: number;
    token: string;
    expiraEn: Date;
    usadoEn: Date;
    cita: GhCita;
}
