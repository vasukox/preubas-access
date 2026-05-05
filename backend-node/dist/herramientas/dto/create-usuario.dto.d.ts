export declare class PermisosDto {
    ver?: boolean;
    crear?: boolean;
    editar?: boolean;
    eliminar?: boolean;
}
export declare class CreateUsuarioDto {
    email: string;
    nombres: string;
    apellidos: string;
    numero: string;
    direccion: string;
    rolNombre?: string;
    rolesNombres?: string[];
    password: string;
    passwordConfirmacion: string;
    firmaCreador?: string;
    permisos?: PermisosDto;
    sedeAsignadaId?: number;
}
