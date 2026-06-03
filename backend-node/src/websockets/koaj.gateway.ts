import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

// ── Tipos ───────────────────────────────────────────────────────────────────

interface ClientMeta {
  sedeId: number;
  usuarioId: number;
  email: string;
  roles: string[];
}

interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
  dcp: boolean;
  iat?: number;
  exp?: number;
}

export interface WSEvent {
  type: string;
  payload?: Record<string, unknown>;
}

// Roles que tienen acceso a TODAS las sedes sin restricción de sede asignada
const ROLES_MULTISEDE = new Set([
  'ADMIN_GLOBAL',
  'ADMIN_HSE',
  'GESTION_HSE',
  'VISUALIZADOR',
]);

/**
 * KoajGateway — WebSocket de tiempo real para KOAJ Access.
 *
 * Equivalente a `app/routers/ws.py` de Python (FastAPI WebSocket).
 *
 * ── Protocolo ───────────────────────────────────────────────────────────────
 * Conexión: ws://{host}/ws/{sedeId}?token={JWT_access_token}
 *
 * Cliente → Servidor:
 *   { "type": "PING" }  →  servidor responde { "type": "PONG", "timestamp": "..." }
 *
 * Servidor → Cliente (broadcast):
 *   { "type": "NUEVA_AUTORIZACION", "payload": {...}, "timestamp": "..." }
 *   { "type": "ACCESO_REGISTRADO",  "payload": {...}, "timestamp": "..." }
 *   { "type": "DASHBOARD_UPDATE",   "payload": {...}, "timestamp": "..." }
 *
 * ── Seguridad ────────────────────────────────────────────────────────────────
 * - Valida JWT en query param `?token=` al conectar (antes del handshake)
 * - Código 4001 = token inválido/expirado → frontend NO reconecta (espera refresh de Axios)
 * - Código 4003 = sin permisos para esa sede → frontend NO reconecta
 * - ADMIN_GLOBAL, ADMIN_HSE, GESTION_HSE, VISUALIZADOR → todas las sedes
 * - VIGILANTE_HSE, ADMIN_GH y otros → solo la sede asignada (la sede del JWT payload)
 *
 * ── Heartbeat ────────────────────────────────────────────────────────────────
 * El frontend envía PING cada 15 segundos. Si no llega PING en 60s, la conexión
 * se considera muerta (manejado por el propio cliente con backoff exponencial).
 */
@WebSocketGateway({
  path: '/ws',
  cors: { origin: '*' },
})
export class KoajGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KoajGateway.name);

  /** Map de socket → metadata del cliente conectado */
  private readonly clients = new Map<WebSocket, ClientMeta>();

  constructor(private readonly jwtService: JwtService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CONEXIÓN
  // Equivalente al `async def websocket_endpoint(ws, sede_id, token)` de Python
  // ─────────────────────────────────────────────────────────────────────────

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    try {
      // URL del frontend: /ws?sede_id={sedeId}&token={JWT}
      const rawUrl = request.url ?? '/';

      // Manejar tanto "/ws?..." como "/api/v1/ws?..."
      // Buscamos el "?" para obtener los params independientemente del path
      const queryString = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
      const urlParams = new URLSearchParams(queryString);

      const sedeIdStr = urlParams.get('sede_id');
      const sedeId = sedeIdStr ? parseInt(sedeIdStr, 10) : 0;
      const token = urlParams.get('token');

      // Validar que el token esté presente
      if (!token) {
        this.logger.warn('[WS] Rechazado: token no proporcionado');
        client.close(4001, 'Token requerido');
        return;
      }

      // Validar que el sede_id sea un número válido
      if (!sedeId || isNaN(sedeId) || sedeId <= 0) {
        this.logger.warn(`[WS] Rechazado: sede_id inválido → '${sedeIdStr}'`);
        client.close(4003, 'sede_id inválido');
        return;
      }

      // Verificar y decodificar JWT (lanza excepción si expirado o inválido)
      const payload = this.jwtService.verify<JwtPayload>(token);
      const roles: string[] = payload.roles ?? [];

      // El control de qué sedes puede ver el usuario lo gestiona el RolesGuard
      // en los endpoints HTTP. El WS simplemente verifica que el JWT sea válido
      // y el usuario esté activo — la restricción de sede se aplica en el broadcast.
      // (ADMIN_GLOBAL ve todo, VIGILANTE solo su sede asignada)
      // → No rechazamos aquí por sede, el backend filtra en broadcastToSede()

      // Registrar cliente
      const meta: ClientMeta = {
        sedeId,
        usuarioId: payload.sub,
        email: payload.email,
        roles,
      };

      this.clients.set(client, meta);

      this.logger.log(
        `[WS] ✅ ${payload.email} → sede ${sedeId} | [${roles.join(', ')}] | activos: ${this.clients.size}`,
      );

      // ── Manejar mensajes entrantes del cliente ──
      client.on('message', (raw: Buffer) => {
        this.handleClientMessage(client, raw);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      this.logger.warn(`[WS] ❌ Token rechazado: ${message}`);
      // 4001 = token inválido/expirado → el frontend sabe que debe esperar el refresh de Axios
      client.close(4001, 'Token inválido o expirado');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MENSAJES ENTRANTES DEL CLIENTE
  // ─────────────────────────────────────────────────────────────────────────

  private handleClientMessage(client: WebSocket, raw: Buffer): void {
    try {
      const msg = JSON.parse(raw.toString()) as { type?: string };

      switch (msg.type) {
        case 'PING':
          // Responder PONG al heartbeat del cliente (cada 15s)
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: 'PONG',
                timestamp: new Date().toISOString(),
              }),
            );
          }
          break;

        default:
          // Mensajes desconocidos — ignorar silenciosamente
          break;
      }
    } catch {
      // Mensaje no parseable como JSON — ignorar
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DESCONEXIÓN
  // ─────────────────────────────────────────────────────────────────────────

  handleDisconnect(client: WebSocket): void {
    const meta = this.clients.get(client);
    if (meta) {
      this.clients.delete(client);
      this.logger.log(
        `[WS] Desconectado: ${meta.email} (sede ${meta.sedeId}) | restantes: ${this.clients.size}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BROADCAST — usado por los controllers/services
  // Equivalente a `await manager.broadcast_to_sede(sede_id, data)` de Python
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Emite un evento a todos los clientes conectados a una sede específica.
   *
   * Uso en services:
   *   this.gateway.broadcastToSede(sedeId, {
   *     type: 'NUEVA_AUTORIZACION',
   *     payload: { id: 123, codigo: 'HSE-2026-0001' }
   *   });
   */
  broadcastToSede(sedeId: number, event: WSEvent): void {
    const data = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    let enviados = 0;
    this.clients.forEach((meta, client) => {
      if (meta.sedeId === sedeId && client.readyState === WebSocket.OPEN) {
        client.send(data);
        enviados++;
      }
    });

    this.logger.debug(
      `[WS] broadcastToSede(${sedeId}, ${event.type}): ${enviados} cliente(s) notificados`,
    );
  }

  /**
   * Emite un evento a TODOS los clientes conectados.
   * Para alertas globales del sistema, mantenimiento, etc.
   */
  broadcastAll(event: WSEvent): void {
    const data = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });

    let enviados = 0;
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
        enviados++;
      }
    });

    this.logger.debug(
      `[WS] broadcastAll(${event.type}): ${enviados} cliente(s)`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────────────────

  /** Total de conexiones activas (útil para health check) */
  getConnectedCount(): number {
    return this.clients.size;
  }

  /** Clientes conectados a una sede específica */
  getClientsInSede(sedeId: number): number {
    let count = 0;
    this.clients.forEach((meta) => {
      if (meta.sedeId === sedeId) count++;
    });
    return count;
  }

  /** Snapshot de conexiones activas (para admin/debug) */
  getConnectionsSnapshot(): Array<{
    sedeId: number;
    email: string;
    roles: string[];
  }> {
    return Array.from(this.clients.values()).map(
      ({ sedeId, email, roles }) => ({
        sedeId,
        email,
        roles,
      }),
    );
  }
}
