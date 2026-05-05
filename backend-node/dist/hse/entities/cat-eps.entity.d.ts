import { BaseEntity } from '../../common/entities/base.entity';
import { HseSegSocial } from './hse-seg-social.entity';
export declare class CatEps extends BaseEntity {
    nombre: string;
    codigo: string;
    activa: boolean;
    seguridadSocial: HseSegSocial[];
}
