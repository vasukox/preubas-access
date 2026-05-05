"""
KOAJ Access v2.0 — Permoda S.A.S.
Router WebSocket — notificaciones en tiempo real

Protocolo:
  Conexión : ws://{host}/ws/{sede_id}?token={JWT}
  Heartbeat: cliente envía {"type": "PING"} → servidor responde {"type": "PONG"}
  Mensajes : el servidor enviará eventos del tipo WSMessage cuando haya novedades

Autenticación:
  El JWT se pasa por query param `token` porque los WebSockets del navegador
  no permiten cabeceras personalizadas (Authorization) en el handshake inicial.
"""

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.usuario import Perfil, Usuario, UsuarioRol
from app.utils.jwt import verify_access_token

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{sede_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    sede_id:   int,
    token:     str = Query(..., description="JWT de acceso"),
):
    # ── Validar token antes de aceptar la conexión ────────────────
    payload = verify_access_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Token inválido o expirado")
        return

    usuario_id = payload.get("sub")
    if not isinstance(usuario_id, int):
        await websocket.close(code=4001, reason="Token malformado")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Usuario)
            .options(selectinload(Usuario.roles).selectinload(UsuarioRol.rol))
            .where(Usuario.id == usuario_id, Usuario.deleted_at.is_(None))
        )
        usuario = result.scalar_one_or_none()

        if not usuario or not usuario.activo:
            await websocket.close(code=4003, reason="Usuario inactivo o no encontrado")
            return

        roles = {r.rol.nombre for r in usuario.roles}
        if "ADMIN_GLOBAL" not in roles and "ADMIN_HSE" not in roles:
            sede_permitida = usuario.sede_asignada_id

            if sede_permitida is None:
                sede_result = await db.execute(
                    select(Perfil.sede_default_id)
                    .where(
                        Perfil.usuario_id == usuario.id,
                        Perfil.deleted_at.is_(None),
                    )
                )
                sede_permitida = sede_result.scalar_one_or_none()

            if sede_permitida is None or sede_permitida != sede_id:
                await websocket.close(code=4003, reason="Sin permisos para esta sede")
                return

    await websocket.accept()
    logger.info(
        "[WS] Conexión aceptada — usuario_id=%s sede_id=%s roles=%s",
        usuario_id, sede_id, list(roles),
    )

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                message = json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                logger.warning("[WS] Mensaje no parseable de usuario_id=%s", usuario_id)
                continue

            if message.get("type") == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))

    except WebSocketDisconnect:
        logger.info(
            "[WS] Desconectado — usuario_id=%s sede_id=%s",
            usuario_id, sede_id,
        )
