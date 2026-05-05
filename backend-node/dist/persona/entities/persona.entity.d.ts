import { BaseEntity } from '../../common/entities/base.entity';
import { Proveedor } from './proveedor.entity';
export declare class Persona extends BaseEntity {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefonoCelular: string;
    ciudadOperacion: string;
    direccionDomicilio: string;
    esExtranjero: boolean;
    fechaNacimiento: Date;
    tratamientoDatos: boolean;
    proveedorId: number;
    tipologiaHse: string;
    activo: boolean;
    notas: string;
    proveedor: Proveedor;
}
