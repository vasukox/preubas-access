import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export declare class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    private readonly reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>>;
}
