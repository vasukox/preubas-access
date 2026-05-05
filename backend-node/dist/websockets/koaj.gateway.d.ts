import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
export interface WSEvent {
    type: string;
    payload?: Record<string, unknown>;
}
export declare class KoajGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    private readonly clients;
    constructor(jwtService: JwtService);
    handleConnection(client: WebSocket, request: IncomingMessage): void;
    private handleClientMessage;
    handleDisconnect(client: WebSocket): void;
    broadcastToSede(sedeId: number, event: WSEvent): void;
    broadcastAll(event: WSEvent): void;
    getConnectedCount(): number;
    getClientsInSede(sedeId: number): number;
    getConnectionsSnapshot(): Array<{
        sedeId: number;
        email: string;
        roles: string[];
    }>;
}
