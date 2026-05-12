import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Transforma todas las claves del request body de snake_case a camelCase.
 * El frontend envía snake_case; los DTOs de NestJS usan camelCase.
 */
@Injectable()
export class SnakeToCamelMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.transformKeys(req.body);
    }
    next();
  }

  private transformKeys(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((item) => this.transformKeys(item));
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[this.snakeToCamel(key)] = this.transformKeys(val);
      }
      return result;
    }
    return value;
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  }
}
