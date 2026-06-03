import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * SnakeToCamelPipe — transforma snake_case → camelCase en el body de requests.
 *
 * El frontend envía snake_case (ej: trabajo_alturas).
 * Los DTOs del backend esperan camelCase (ej: trabajoAlturas).
 *
 * Este pipe recorre recursivamente el objeto y convierte todas las claves
 * de snake_case a camelCase ANTES de la validación.
 */
@Injectable()
export class SnakeToCamelPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return this.transformKeys(value);
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

    if (Buffer.isBuffer(value)) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const camelKey = this.snakeToCamel(key);
        result[camelKey] = this.transformKeys(val);
      }

      return result;
    }

    return value;
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }
}
