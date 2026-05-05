import { BaseEntity } from '../../common/entities/base.entity';
import { HseSegSocial } from './hse-seg-social.entity';
export declare class CatAfp extends BaseEntity {
    nombre: string;
    codigo: string;
    activa: boolean;
    seguridadSocial: HseSegSocial[];
}
