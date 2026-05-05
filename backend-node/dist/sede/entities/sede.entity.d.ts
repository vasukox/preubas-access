import { BaseEntity } from '../../common/entities/base.entity';
import { Ubicacion } from './ubicacion.entity';
export declare class Sede extends BaseEntity {
    nombre: string;
    codigo: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    activa: boolean;
    capacidadCarros: number;
    capacidadMotos: number;
    capacidadBicis: number;
    aplicaPicoPlaca: boolean;
    notas: string;
    ubicaciones: Ubicacion[];
}
