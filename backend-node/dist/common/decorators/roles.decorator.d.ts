import { RolNombre } from '../enums/rol.enum';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: RolNombre[]) => import("@nestjs/common").CustomDecorator<string>;
