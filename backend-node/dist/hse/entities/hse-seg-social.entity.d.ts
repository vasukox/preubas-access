import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
import { CatEps } from './cat-eps.entity';
import { CatArl } from './cat-arl.entity';
import { CatAfp } from './cat-afp.entity';
import { PilaTipo, PilaEstado } from '../../common/enums/hse.enum';
export declare class HseSegSocial extends BaseEntity {
    contratistaId: number;
    esTitular: boolean;
    nombrePersona: string;
    cedulaPersona: string;
    epsId: number;
    epsVigencia: Date;
    arlId: number;
    arlVigencia: Date;
    afpId: number;
    afpVigencia: Date;
    pilaTipo: PilaTipo;
    pilaEstado: PilaEstado;
    pilaArchivo: string;
    sstTieneVigente: boolean;
    sstResponsableNombre: string;
    sstResolucionRegistro: string;
    contratista: HseContratista;
    eps: CatEps;
    arl: CatArl;
    afp: CatAfp;
}
