import { BaseEntity } from '../../common/entities/base.entity';
import { Persona } from '../../persona/entities/persona.entity';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Sede } from '../../sede/entities/sede.entity';
export declare class HseExcepcion extends BaseEntity {
    personaId: number | null;
    tipoDocumento: string | null;
    numeroDocumento: string | null;
    nombreCompleto: string | null;
    proveedorId: number | null;
    origenExcepcion: string;
    ubicacionId: number | null;
    aprobadoPor: number;
    sedeId: number;
    motivo: string;
    fechaInicio: Date;
    fechaFin: Date;
    activa: boolean;
    persona: Persona | null;
    aprobador: Usuario;
    sede: Sede;
}
