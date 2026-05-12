"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';
        let code = 'INTERNAL_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' &&
                Array.isArray(exceptionResponse.message)) {
                message = exceptionResponse.message.join(', ');
                code = 'VALIDATION_ERROR';
            }
            else if (typeof exceptionResponse === 'object' &&
                exceptionResponse.error &&
                exceptionResponse.error.code) {
                message = exceptionResponse.error.message;
                code = exceptionResponse.error.code;
            }
            else if (typeof exceptionResponse === 'object' &&
                exceptionResponse.code &&
                exceptionResponse.message) {
                message = exceptionResponse.message;
                code = exceptionResponse.code;
            }
            else {
                message = exceptionResponse.message || exception.message;
                if (status === 401)
                    code = 'UNAUTHORIZED';
                if (status === 403)
                    code = 'FORBIDDEN';
                if (status === 404)
                    code = 'NOT_FOUND';
                if (status === 400 && code === 'INTERNAL_ERROR')
                    code = 'BAD_REQUEST';
            }
        }
        else {
            this.logger.error(`Excepción no controlada en ${request.method} ${request.url}: ${exception.message}`, exception.stack);
        }
        response.status(status).json({
            success: false,
            error: {
                code,
                message,
            },
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map