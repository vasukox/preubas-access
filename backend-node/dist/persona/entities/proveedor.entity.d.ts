import { BaseEntity } from '../../common/entities/base.entity';
import { Persona } from './persona.entity';
export declare class Proveedor extends BaseEntity {
    nomProveedor: string;
    nitProveedor: string;
    tipoIdentificacionProv: string;
    estadoProv: boolean;
    direccionProv: string;
    telefonoProv: string;
    emailContacto: string;
    ciudad: string;
    tratamientoDatos: boolean;
    notas: string;
    personas: Persona[];
}
