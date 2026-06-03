import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * SnakeCaseInterceptor — transforma camelCase → snake_case en respuestas JSON.
 *
 * TypeORM retorna propiedades en camelCase (ej: nombreCompleto).
 * El frontend React espera snake_case (ej: nombre_completo).
 *
 * Este interceptor recorre recursivamente el objeto de respuesta
 * y convierte todas las claves a snake_case automáticamente.
 */
@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.transformKeys(data)));
  }

  private transformKeys(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transformKeys(item));
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const snakeKey = this.camelToSnake(key);
        result[snakeKey] = this.transformKeys(val);
      }

      return result;
    }

    return value;
  }

  private camelToSnake(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
