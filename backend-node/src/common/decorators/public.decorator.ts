import { SetMetadata } from '@nestjs/common';

/**
 * Key usada para marcar rutas que no requieren autenticación.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar endpoints que NO requieren autenticación.
 *
 * Equivalente a no usar `Depends(get_current_user)` en Python.
 *
 * Uso:
 *   @Public()
 *   @Post('/login')
 *   async login() { ... }
 *
 *   @Public()
 *   @Get('/portal/:token')
 *   async validarPortal() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
