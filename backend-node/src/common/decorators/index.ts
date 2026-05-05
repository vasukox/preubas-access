/**
 * Decoradores personalizados de autenticación y autorización.
 *
 * Exporta todos los decorators para uso centralizado.
 */

export { Roles, ROLES_KEY } from './roles.decorator';
export { Permisos, PERMISOS_KEY } from './permisos.decorator';
export type { Operacion } from './permisos.decorator';
export { Public, IS_PUBLIC_KEY } from './public.decorator';
