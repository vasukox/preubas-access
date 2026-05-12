import { BaseEntity } from '../../common/entities/base.entity';
import { Proveedor } from '../../persona/entities/proveedor.entity';
import { Sede } from '../../sede/entities/sede.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { HseContratista } from './hse-contratista.entity';
import { TipoContratista, EstadoAutorizacion } from '../../common/enums/hse.enum';
export declare class HseAutorizacion extends BaseEntity {
    codigo: string;
    proveedorId: number | null;
    sedeId: number;
    creadoPor: number;
    responsableInternoId: number;
    tipoContratista: TipoContratista;
    descripcionActividad: string;
    fechaInicio: Date;
    fechaFin: Date;
    estado: EstadoAutorizacion;
    motivoDenegacion: string | null;
    proveedor: Proveedor;
    sede: Sede;
    creador: Usuario;
    responsableInterno: Usuario;
    contratistas: HseContratista[];
}
