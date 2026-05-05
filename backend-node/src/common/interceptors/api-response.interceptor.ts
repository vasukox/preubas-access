import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // Si el controlador ya retornó el objeto con el formato (e.g. porque necesitaba pasar un 'message' custom),
        // lo dejamos tal cual.
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        // De lo contrario, lo envolvemos en el estándar
        return {
          success: true,
          data: res ?? null,
        };
      }),
    );
  }
}
