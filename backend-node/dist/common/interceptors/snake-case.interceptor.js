"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnakeCaseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let SnakeCaseInterceptor = class SnakeCaseInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => this.transformKeys(data)));
    }
    transformKeys(value) {
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
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                const snakeKey = this.camelToSnake(key);
                result[snakeKey] = this.transformKeys(val);
            }
            return result;
        }
        return value;
    }
    camelToSnake(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }
};
exports.SnakeCaseInterceptor = SnakeCaseInterceptor;
exports.SnakeCaseInterceptor = SnakeCaseInterceptor = __decorate([
    (0, common_1.Injectable)()
], SnakeCaseInterceptor);
//# sourceMappingURL=snake-case.interceptor.js.map