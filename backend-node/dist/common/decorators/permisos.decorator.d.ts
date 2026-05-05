export declare const PERMISOS_KEY = "permisos";
export type Operacion = 'ver' | 'crear' | 'editar' | 'eliminar';
export declare const Permisos: (...operaciones: Operacion[]) => import("@nestjs/common").CustomDecorator<string>;
