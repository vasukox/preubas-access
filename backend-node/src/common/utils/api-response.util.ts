import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Interfaz estándar de respuesta exitosa.
 * Equivalente a `ok()` de Python (schemas/common.py).
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Interfaz estándar de respuesta de error.
 * Equivalente a `err()` de Python.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Construye una respuesta exitosa en el formato estándar del sistema.
 *
 * @param data  - Payload de la respuesta
 * @param message - Mensaje opcional para el cliente
 * @returns Objeto ApiResponse<T>
 *
 * @example
 *   return ok(usuario, 'Usuario creado correctamente');
 *   return ok([sede1, sede2]);
 */
export function ok<T>(data: T, message?: string): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  if (message) {
    response.message = message;
  }
  return response;
}

/**
 * Lanza una HttpException con el formato estándar de error del sistema.
 *
 * @param code    - Código de error (ej: 'AUTH_ERROR', 'VALIDATION_ERROR')
 * @param message - Mensaje legible para el usuario
 * @param status  - Código HTTP (default: 400)
 *
 * @example
 *   throw err('AUTH_ERROR', 'Credenciales inválidas', 401);
 *   throw err('NOT_FOUND', 'Sede no encontrada', 404);
 */
export function err(
  code: string,
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
): never {
  throw new HttpException(
    {
      success: false,
      error: { code, message },
    } satisfies ApiErrorResponse,
    status,
  );
}
