import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // 1. Manejo de errores de validación de Class-Validator (DTOs)
      if (
        typeof exceptionResponse === 'object' &&
        Array.isArray(exceptionResponse.message)
      ) {
        message = exceptionResponse.message.join(', ');
        code = 'VALIDATION_ERROR';
      }
      // 2. Manejo si el error ya viene en el formato estándar de Koaj Access  { error: { code, message } }
      else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse.error &&
        exceptionResponse.error.code
      ) {
        message = exceptionResponse.error.message;
        code = exceptionResponse.error.code;
      }
      // 3. Manejo directo { code, message } — usado por AuthService y otros
      else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse.code &&
        exceptionResponse.message
      ) {
        message = exceptionResponse.message;
        code = exceptionResponse.code;
      }
      // 4. Fallback genérico para otros HttpException
      else {
        message = exceptionResponse.message || exception.message;
        if (status === 401) code = 'UNAUTHORIZED';
        if (status === 403) code = 'FORBIDDEN';
        if (status === 404) code = 'NOT_FOUND';
        if (status === 400 && code === 'INTERNAL_ERROR') code = 'BAD_REQUEST';
      }
    } else {
      // Registrar en el log los errores 500 no capturados
      this.logger.error(
        `Excepción no controlada en ${request.method} ${request.url}: ${
          (exception as Error).message
        }`,
        (exception as Error).stack,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
}
