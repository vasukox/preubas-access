"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KoajGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoajGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ws_1 = require("ws");
const ROLES_MULTISEDE = new Set([
    'ADMIN_GLOBAL',
    'ADMIN_HSE',
    'GESTION_HSE',
    'VISUALIZADOR',
]);
let KoajGateway = KoajGateway_1 = class KoajGateway {
    jwtService;
    server;
    logger = new common_1.Logger(KoajGateway_1.name);
    clients = new Map();
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    handleConnection(client, request) {
        try {
            const rawUrl = request.url ?? '/';
            const queryString = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
            const urlParams = new URLSearchParams(queryString);
            const sedeIdStr = urlParams.get('sede_id');
            const sedeId = sedeIdStr ? parseInt(sedeIdStr, 10) : 0;
            const token = urlParams.get('token');
            if (!token) {
                this.logger.warn('[WS] Rechazado: token no proporcionado');
                client.close(4001, 'Token requerido');
                return;
            }
            if (!sedeId || isNaN(sedeId) || sedeId <= 0) {
                this.logger.warn(`[WS] Rechazado: sede_id inválido → '${sedeIdStr}'`);
                client.close(4003, 'sede_id inválido');
                return;
            }
            const payload = this.jwtService.verify(token);
            const roles = payload.roles ?? [];
            const meta = {
                sedeId,
                usuarioId: payload.sub,
                email: payload.email,
                roles,
            };
            this.clients.set(client, meta);
            this.logger.log(`[WS] ✅ ${payload.email} → sede ${sedeId} | [${roles.join(', ')}] | activos: ${this.clients.size}`);
            client.on('message', (raw) => {
                this.handleClientMessage(client, raw);
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            this.logger.warn(`[WS] ❌ Token rechazado: ${message}`);
            client.close(4001, 'Token inválido o expirado');
        }
    }
    handleClientMessage(client, raw) {
        try {
            const msg = JSON.parse(raw.toString());
            switch (msg.type) {
                case 'PING':
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'PONG',
                            timestamp: new Date().toISOString(),
                        }));
                    }
                    break;
                default:
                    break;
            }
        }
        catch {
        }
    }
    handleDisconnect(client) {
        const meta = this.clients.get(client);
        if (meta) {
            this.clients.delete(client);
            this.logger.log(`[WS] Desconectado: ${meta.email} (sede ${meta.sedeId}) | restantes: ${this.clients.size}`);
        }
    }
    broadcastToSede(sedeId, event) {
        const data = JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
        });
        let enviados = 0;
        this.clients.forEach((meta, client) => {
            if (meta.sedeId === sedeId && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(data);
                enviados++;
            }
        });
        this.logger.debug(`[WS] broadcastToSede(${sedeId}, ${event.type}): ${enviados} cliente(s) notificados`);
    }
    broadcastAll(event) {
        const data = JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
        });
        let enviados = 0;
        this.clients.forEach((_, client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(data);
                enviados++;
            }
        });
        this.logger.debug(`[WS] broadcastAll(${event.type}): ${enviados} cliente(s)`);
    }
    getConnectedCount() {
        return this.clients.size;
    }
    getClientsInSede(sedeId) {
        let count = 0;
        this.clients.forEach((meta) => {
            if (meta.sedeId === sedeId)
                count++;
        });
        return count;
    }
    getConnectionsSnapshot() {
        return Array.from(this.clients.values()).map(({ sedeId, email, roles }) => ({
            sedeId,
            email,
            roles,
        }));
    }
};
exports.KoajGateway = KoajGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], KoajGateway.prototype, "server", void 0);
exports.KoajGateway = KoajGateway = KoajGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/ws',
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], KoajGateway);
//# sourceMappingURL=koaj.gateway.js.map