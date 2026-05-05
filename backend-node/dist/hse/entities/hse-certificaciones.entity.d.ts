import { BaseEntity } from '../../common/entities/base.entity';
import { HseContratista } from './hse-contratista.entity';
export declare class HseCertificaciones extends BaseEntity {
    contratistaId: number;
    urlCertificadoAlturas: string;
    fechaVencimientoAlturas: Date;
    urlCertificadoConfinados: string;
    fechaVencimientoConfinados: Date;
    urlLicenciaSst: string;
    urlOtrosCertificados: string;
    contratista: HseContratista;
}
