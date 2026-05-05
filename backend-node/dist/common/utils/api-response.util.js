"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.err = err;
const common_1 = require("@nestjs/common");
function ok(data, message) {
    const response = { success: true, data };
    if (message) {
        response.message = message;
    }
    return response;
}
function err(code, message, status = common_1.HttpStatus.BAD_REQUEST) {
    throw new common_1.HttpException({
        success: false,
        error: { code, message },
    }, status);
}
//# sourceMappingURL=api-response.util.js.map