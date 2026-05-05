"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_module_1 = require("../config/config.module");
const config_service_1 = require("../config/config.service");
const koaj_gateway_1 = require("./koaj.gateway");
let WebsocketsModule = class WebsocketsModule {
};
exports.WebsocketsModule = WebsocketsModule;
exports.WebsocketsModule = WebsocketsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: (config) => ({
                    secret: config.jwtSecret,
                }),
                inject: [config_service_1.ConfigService],
            }),
        ],
        providers: [koaj_gateway_1.KoajGateway],
        exports: [koaj_gateway_1.KoajGateway],
    })
], WebsocketsModule);
//# sourceMappingURL=websockets.module.js.map