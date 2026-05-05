import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { CatEps } from './cat-eps.entity';
import { CatArl } from './cat-arl.entity';
import { CatAfp } from './cat-afp.entity';
export declare class HseSegSocial extends BaseEntity {
    contratistaId: number;
    epsId: number;
    arlId: number;
    afpId: number;
    urlPlanilla: string;
    fechaInicioCobertura: Date;
    fechaFinCobertura: Date;
    contratista: HseContratista;
    eps: CatEps;
    arl: CatArl;
    afp: CatAfp;
}
