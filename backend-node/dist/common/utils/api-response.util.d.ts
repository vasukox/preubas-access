export interface ApiResponse<T> {
    success: true;
    data: T;
    message?: string;
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export declare function ok<T>(data: T, message?: string): ApiResponse<T>;
export declare function err(code: string, message: string, status?: number): never;
