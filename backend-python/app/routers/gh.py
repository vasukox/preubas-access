"""
KOAJ Access v2.0 — Permoda S.A.S.
Router base del módulo Gestión Humana (GH).
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.usuario import Usuario
from app.schemas.common import ApiResponse, err, ok
from app.schemas.gh import (
    GhCatalogoItemResponse,
    GhCitaGrupoCreateRequest,
    GhCitaCreateRequest,
    GhCitaEstadoRequest,
    GhCitaResponse,
    GhCitaUpdateRequest,
    GhDashboardResponse,
    GhImportacionCreateRequest,
    GhImportacionDetalleListadoResponse,
    GhImportacionResponse,
    GhPortalInduccionAccionResponse,
    GhPortalInduccionCodigoRequest,
    GhPortalInduccionValidateResponse,
    GhSesionInduccionCreateRequest,
    GhSesionInduccionEstadoRequest,
    GhSesionInduccionResponse,
    GhCodigoTemporalResponse,
    GhMaestroDotacionCreateRequest,
    GhMaestroDotacionResponse,
    GhMaestroDotacionUpdateRequest,
    GhDotacionEntregaCreateRequest,
    GhDotacionEntregaDetalleCreateRequest,
    GhDotacionEntregaResponse,
    GhPortalAccionResponse,
    GhPortalConfirmRequest,
    GhPortalReagendarRequest,
    GhPortalValidateResponse,
    GhVigilanteAccesoRequest,
    GhVigilanteAccesoResponse,
    GhVigilanteVerificarRequest,
    GhVigilanteVerificarResponse,
)
from app.services.gh_service import GhService


router = APIRouter(prefix="/api/v1/gh", tags=["Gestión Humana"])


@router.get(
    "/catalogos/tipos-cita",
    response_model=ApiResponse[list[GhCatalogoItemResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_tipos_cita(db: AsyncSession = Depends(get_db)):
    service = GhService(db)
    return ok(await service.list_tipos_cita())


@router.get(
    "/catalogos/estados-cita",
    response_model=ApiResponse[list[GhCatalogoItemResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_estados_cita(db: AsyncSession = Depends(get_db)):
    service = GhService(db)
    return ok(await service.list_estados_cita())


@router.get(
    "/citas",
    response_model=ApiResponse[list[GhCitaResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_citas(
    sede_id: int = Query(...),
    estado: str | None = Query(default=None),
    tipo_cita: str | None = Query(default=None),
    busqueda: str | None = Query(default=None),
    fecha_desde: datetime | None = Query(default=None),
    fecha_hasta: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = GhService(db)
    return ok(
        await service.listar_citas(
            sede_id=sede_id,
            estado=estado,
            tipo_cita=tipo_cita,
            busqueda=busqueda,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            page=page,
            per_page=per_page,
        )
    )


@router.post(
    "/citas",
    response_model=ApiResponse[GhCitaResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_cita(
    body: GhCitaCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(await service.crear_cita(body, current_user.id), message="Cita creada correctamente.")
    except ValueError as e:
        err("GH_ERROR", str(e), 400)


@router.post(
    "/citas/grupo",
    response_model=ApiResponse[list[GhCitaResponse]],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_citas_grupo(
    body: GhCitaGrupoCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.crear_citas_grupo(body, current_user.id),
            message="Citas grupales creadas correctamente.",
        )
    except ValueError as e:
        err("GH_ERROR", str(e), 400)


@router.get(
    "/citas/{cita_id}",
    response_model=ApiResponse[GhCitaResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def get_cita(cita_id: int, db: AsyncSession = Depends(get_db)):
    try:
        service = GhService(db)
        return ok(await service.get_cita(cita_id))
    except ValueError as e:
        err("GH_ERROR", str(e), 404)


@router.put(
    "/citas/{cita_id}",
    response_model=ApiResponse[GhCitaResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def actualizar_cita(
    cita_id: int,
    body: GhCitaUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.actualizar_cita(cita_id, body, current_user.id),
            message="Cita actualizada correctamente.",
        )
    except ValueError as e:
        err("GH_ERROR", str(e), 404)


@router.post(
    "/citas/{cita_id}/estado",
    response_model=ApiResponse[GhCitaResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def cambiar_estado_cita(
    cita_id: int,
    body: GhCitaEstadoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.cambiar_estado(cita_id, body, current_user.id),
            message="Estado actualizado correctamente.",
        )
    except ValueError as e:
        err("GH_ERROR", str(e), 404)


@router.delete(
    "/citas/{cita_id}",
    response_model=ApiResponse[None],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def eliminar_cita(
    cita_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        await service.eliminar_cita(cita_id, current_user.id)
        return ok(None, message="Cita eliminada correctamente.")
    except ValueError as e:
        err("GH_ERROR", str(e), 404)


@router.get(
    "/portal/{token}",
    response_model=ApiResponse[GhPortalValidateResponse],
)
async def validar_token_portal(token: str, db: AsyncSession = Depends(get_db)):
    try:
        service = GhService(db)
        return ok(await service.validar_portal(token))
    except ValueError as e:
        err("GH_PORTAL_ERROR", str(e), 404)


@router.post(
    "/portal/{token}/confirmar",
    response_model=ApiResponse[GhPortalAccionResponse],
)
async def portal_confirmar(
    token: str,
    body: GhPortalConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = GhService(db)
        return ok(await service.portal_confirmar(token, body), message="Estado de cita actualizado desde portal.")
    except ValueError as e:
        err("GH_PORTAL_ERROR", str(e), 400)


@router.post(
    "/portal/{token}/reagendar",
    response_model=ApiResponse[GhPortalAccionResponse],
)
async def portal_reagendar(
    token: str,
    body: GhPortalReagendarRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = GhService(db)
        return ok(await service.portal_reagendar(token, body), message="Cita reagendada desde portal.")
    except ValueError as e:
        err("GH_PORTAL_ERROR", str(e), 400)


@router.post(
    "/vigilante/verificar",
    response_model=ApiResponse[GhVigilanteVerificarResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VIGILANTE_HSE"))],
)
async def verificar_vigilante(
    body: GhVigilanteVerificarRequest,
    db: AsyncSession = Depends(get_db),
):
    service = GhService(db)
    return ok(await service.verificar_vigilante(body))


@router.post(
    "/vigilante/acceso",
    response_model=ApiResponse[GhVigilanteAccesoResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VIGILANTE_HSE"))],
)
async def registrar_acceso_vigilante(
    body: GhVigilanteAccesoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.registrar_acceso_vigilante(body, current_user.id),
            message="Acceso de vigilancia GH registrado correctamente.",
        )
    except ValueError as e:
        err("GH_VIGILANCIA_ERROR", str(e), 400)


@router.post(
    "/importaciones",
    response_model=ApiResponse[GhImportacionResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_importacion(
    body: GhImportacionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    service = GhService(db)
    return ok(
        await service.crear_importacion(body, current_user.id),
        message="Importación registrada correctamente.",
    )


@router.get(
    "/importaciones/{importacion_id}",
    response_model=ApiResponse[GhImportacionDetalleListadoResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def get_importacion(importacion_id: int, db: AsyncSession = Depends(get_db)):
    try:
        service = GhService(db)
        return ok(await service.get_importacion(importacion_id))
    except ValueError as e:
        err("GH_IMPORTACION_ERROR", str(e), 404)


@router.post(
    "/inducciones/sesiones",
    response_model=ApiResponse[GhSesionInduccionResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_sesion_induccion(
    body: GhSesionInduccionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.crear_sesion_induccion(body, current_user.id),
            message="Sesión de inducción creada correctamente.",
        )
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 400)


@router.get(
    "/inducciones/sesiones",
    response_model=ApiResponse[list[GhSesionInduccionResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_sesiones_induccion(
    sede_id: int | None = Query(default=None),
    estado_sesion: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = GhService(db)
    return ok(await service.listar_sesiones_induccion(sede_id=sede_id, estado_sesion=estado_sesion))


@router.get(
    "/inducciones/sesiones/{sesion_id}",
    response_model=ApiResponse[GhSesionInduccionResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def get_sesion_induccion(sesion_id: int, db: AsyncSession = Depends(get_db)):
    try:
        service = GhService(db)
        return ok(await service.get_sesion_induccion(sesion_id))
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 404)


@router.post(
    "/inducciones/sesiones/{sesion_id}/estado",
    response_model=ApiResponse[GhSesionInduccionResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def cambiar_estado_sesion_induccion(
    sesion_id: int,
    body: GhSesionInduccionEstadoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.cambiar_estado_sesion_induccion(sesion_id=sesion_id, body=body, usuario_id=current_user.id),
            message="Estado de sesión actualizado correctamente.",
        )
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 400)


@router.post(
    "/inducciones/sesiones/{sesion_id}/generar-codigo-checkin",
    response_model=ApiResponse[GhCodigoTemporalResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def generar_codigo_checkin(
    sesion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.generar_codigo_temporal_induccion(
                sesion_id=sesion_id,
                tipo="CHECKIN",
                usuario_id=current_user.id,
            ),
            message="Código de check-in generado.",
        )
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 400)


@router.post(
    "/inducciones/sesiones/{sesion_id}/generar-codigo-checkout",
    response_model=ApiResponse[GhCodigoTemporalResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def generar_codigo_checkout(
    sesion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.generar_codigo_temporal_induccion(
                sesion_id=sesion_id,
                tipo="CHECKOUT",
                usuario_id=current_user.id,
            ),
            message="Código de check-out generado.",
        )
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 400)


@router.post(
    "/inducciones/sesiones/{sesion_id}/enviar-links",
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def enviar_links_induccion(
    sesion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        result = await service.enviar_links_induccion(sesion_id=sesion_id, usuario_id=current_user.id)
        return ok(result, message=f"Se han enviado {result['enviados']} links de autogestión.")
    except ValueError as e:
        err("GH_INDUCCION_ERROR", str(e), 400)


@router.get(
    "/portal/induccion/{token}",
    response_model=ApiResponse[GhPortalInduccionValidateResponse],
)
async def portal_induccion_validar(token: str, db: AsyncSession = Depends(get_db)):
    try:
        service = GhService(db)
        return ok(await service.validar_portal_induccion(token))
    except ValueError as e:
        err("GH_PORTAL_INDUCCION_ERROR", str(e), 400)


@router.post(
    "/portal/induccion/{token}/checkin",
    response_model=ApiResponse[GhPortalInduccionAccionResponse],
)
async def portal_induccion_checkin(
    token: str,
    body: GhPortalInduccionCodigoRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = GhService(db)
        return ok(
            await service.portal_induccion_checkin(
                token=token,
                body=body,
                ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            ),
            message="Check-in registrado correctamente.",
        )
    except ValueError as e:
        err("GH_PORTAL_INDUCCION_ERROR", str(e), 400)


@router.post(
    "/portal/induccion/{token}/checkout",
    response_model=ApiResponse[GhPortalInduccionAccionResponse],
)
async def portal_induccion_checkout(
    token: str,
    body: GhPortalInduccionCodigoRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = GhService(db)
        return ok(
            await service.portal_induccion_checkout(
                token=token,
                body=body,
                ip=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            ),
            message="Check-out registrado correctamente.",
        )
    except ValueError as e:
        err("GH_PORTAL_INDUCCION_ERROR", str(e), 400)


@router.get(
    "/dotacion/maestro",
    response_model=ApiResponse[list[GhMaestroDotacionResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_maestro_dotacion(
    sede_id: int | None = Query(default=None),
    area: str | None = Query(default=None),
    cargo: str | None = Query(default=None),
    tipo_contrato: str | None = Query(default=None),
    activos_only: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    service = GhService(db)
    return ok(
        await service.listar_maestro_dotacion(
            sede_id=sede_id,
            area=area,
            cargo=cargo,
            tipo_contrato=tipo_contrato,
            activos_only=activos_only,
        )
    )


@router.post(
    "/dotacion/maestro",
    response_model=ApiResponse[GhMaestroDotacionResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_maestro_dotacion(
    body: GhMaestroDotacionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    service = GhService(db)
    return ok(
        await service.crear_maestro_dotacion(body, current_user.id),
        message="Registro de maestro de dotación creado.",
    )


@router.patch(
    "/dotacion/maestro/{item_id}",
    response_model=ApiResponse[GhMaestroDotacionResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def actualizar_maestro_dotacion(
    item_id: int,
    body: GhMaestroDotacionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.actualizar_maestro_dotacion(item_id=item_id, body=body, usuario_id=current_user.id),
            message="Registro de maestro de dotación actualizado.",
        )
    except ValueError as e:
        err("GH_DOTACION_ERROR", str(e), 404)


@router.get(
    "/dotacion/entregas",
    response_model=ApiResponse[list[GhDotacionEntregaResponse]],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def listar_entregas_dotacion(
    estado: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = GhService(db)
    return ok(await service.listar_entregas_dotacion(estado=estado))


@router.post(
    "/dotacion/entregas",
    response_model=ApiResponse[GhDotacionEntregaResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def crear_entrega_dotacion(
    body: GhDotacionEntregaCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    service = GhService(db)
    return ok(
        await service.crear_entrega_dotacion(body, current_user.id),
        message="Entrega de dotación creada.",
    )


@router.post(
    "/dotacion/entregas/{entrega_id}/detalle",
    response_model=ApiResponse[GhDotacionEntregaResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def agregar_detalle_entrega_dotacion(
    entrega_id: int,
    body: GhDotacionEntregaDetalleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.agregar_detalle_entrega_dotacion(
                entrega_id=entrega_id,
                body=body,
                usuario_id=current_user.id,
            ),
            message="Detalle de entrega registrado.",
        )
    except ValueError as e:
        err("GH_DOTACION_ERROR", str(e), 400)


@router.post(
    "/dotacion/entregas/{entrega_id}/cerrar",
    response_model=ApiResponse[GhDotacionEntregaResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH"))],
)
async def cerrar_entrega_dotacion(
    entrega_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = GhService(db)
        return ok(
            await service.cerrar_entrega_dotacion(entrega_id=entrega_id, usuario_id=current_user.id),
            message="Entrega de dotación cerrada.",
        )
    except ValueError as e:
        err("GH_DOTACION_ERROR", str(e), 400)


@router.get(
    "/dashboard/{sede_id}",
    response_model=ApiResponse[GhDashboardResponse],
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_GH", "VISUALIZADOR"))],
)
async def dashboard_gh(sede_id: int, db: AsyncSession = Depends(get_db)):
    service = GhService(db)
    return ok(await service.dashboard(sede_id))
