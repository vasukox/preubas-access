export declare class CreateSedeDto {
    nombre: string;
    codigo: string;
    ciudad?: string;
    direccion?: string;
    telefono?: string;
    activa?: boolean;
    capacidadCarros?: number;
    capacidadMotos?: number;
    capacidadBicis?: number;
    aplicaPicoPlaca?: boolean;
    notas?: string;
}
export declare class UpdateSedeDto {
    nombre?: string;
    ciudad?: string;
    direccion?: string;
    telefono?: string;
    activa?: boolean;
    capacidadCarros?: number;
    capacidadMotos?: number;
    capacidadBicis?: number;
    aplicaPicoPlaca?: boolean;
    notas?: string;
}
export declare class CreateUbicacionDto {
    sedeId: number;
    nombre: string;
    codigo?: string;
    tipo?: string;
    activa?: boolean;
    descripcion?: string;
}
export declare class UpdateUbicacionDto {
    nombre?: string;
    codigo?: string;
    tipo?: string;
    activa?: boolean;
    descripcion?: string;
}
export declare class CreateCatalogoDto {
    nombre: string;
    codigo: string;
    activa?: boolean;
}
export declare class UpdateCatalogoDto {
    nombre?: string;
    activa?: boolean;
}
export declare class CreateNormaDto {
    numero: number;
    titulo: string;
    contenido: string;
    activa?: boolean;
    sedeId?: number;
}
export declare class UpdateNormaDto {
    numero?: number;
    titulo?: string;
    contenido?: string;
    activa?: boolean;
    sedeId?: number;
}
