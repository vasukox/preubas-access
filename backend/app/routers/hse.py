"""
KOAJ Access v2.0 — Permoda S.A.S.
Router del módulo HSE

Endpoints:
  Catálogos:
    GET    /hse/catalogos/eps
    GET    /hse/catalogos/arl
    GET    /hse/catalogos/afp
    GET    /hse/catalogos/normas/{sede_id}
    GET    /hse/catalogos/proveedores
    POST   /hse/catalogos/proveedores
    PUT    /hse/catalogos/proveedores/{id}
    DELETE /hse/catalogos/proveedores/{id}

  Panel General — Autorizaciones:
    GET    /hse/autorizaciones
    POST   /hse/autorizaciones
    GET    /hse/autorizaciones/{id}
    PUT    /hse/autorizaciones/{id}
    DELETE /hse/autorizaciones/{id}

  Gestión HSE — Contratistas:
    GET  /hse/contratistas/{id}
    POST /hse/contratistas/{id}/aprobar
    POST /hse/contratistas/{id}/denegar
    POST /hse/contratistas/{id}/token

  Portal Autogestión (público — token):
    GET  /hse/autogestion/{token}
    POST /hse/autogestion/{token}/datos-personales
    POST /hse/autogestion/{token}/clasificacion
    POST /hse/autogestion/{token}/seguridad-social
    POST /hse/autogestion/{token}/certificaciones
    POST /hse/autogestion/{token}/examen-medico
    POST /hse/autogestion/{token}/contacto-emergencia
    POST /hse/autogestion/{token}/normas

  Portal Vigilante:
    POST /hse/vigilante/verificar
    POST /hse/vigilante/acceso
    GET  /hse/vigilante/dentro/{sede_id}

  Cumplimiento:
    POST /hse/cumplimiento/iniciar
    PUT  /hse/cumplimiento/{id}
    POST /hse/cumplimiento/{id}/cerrar

  Excepciones:
    GET  /hse/excepciones/{sede_id}
    POST /hse/excepciones
    POST /hse/excepciones/{id}/desactivar

  Dashboard:
    GET  /hse/dashboard/{sede_id}
"""

from pathlib import Path as FilePath

from fastapi import APIRouter, Depends, Request, status, UploadFile, File, Form, Query
from fastapi import HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.usuario import Perfil
from app.models.usuario import Usuario
from app.models.persona import Persona
from app.schemas.common import ApiResponse, ok, err
from app.services.hse_service import HseNotFoundError
from app.schemas.hse import (
    # Catálogos
    CatItemResponse,
    NormaResponse,
    SedeBasicaResponse,
    ProveedorHSEOptionResponse,
    ProveedorHSECreateRequest,
    ProveedorHSEUpdateRequest,
    # Autorizaciones
    AutorizacionCreateRequest,
    AutorizacionUpdateRequest,
    AutorizacionDenegarRequest,
    AutorizacionResponse,
    AutorizacionListResponse,
    # Contratistas
    ContratistaTokenRequest,
    ContratistaDenegarRequest,
    ContratistaEliminarRequest,
    ContratistaActualizarProveedorRequest,
    ContratistaEliminarAdjuntoRequest,
    ContratistaDetalleResponse,
    ContratistaResumenResponse,
    # Autogestión
    AutogestionValidarTokenResponse,
    UploadArchivoResponse,
    DatosPersonalesRequest,
    ClasificacionRequest,
    ClasificacionResponse,
    SegSocialRequest,
    SegSocialResponse,
    CertificacionesRequest,
    CertificacionesResponse,
    ExamenMedicoRequest,
    ExamenMedicoResponse,
    ContactoEmergenciaRequest,
    ContactoEmergenciaResponse,
    AceptacionNormasRequest,
    AceptacionNormasResponse,
    # Vigilante
    VerificarAccesoRequest,
    VerificarAccesoResponse,
    RegistrarAccesoRequest,
    AccesoResponse,
    PersonaDentroResponse,
    # Cumplimiento
    CumplimientoIniciarRequest,
    CumplimientoActualizarRequest,
    CumplimientoCerrarRequest,
    CumplimientoResponse,
    CumplimientoListadoResponse,
    # Excepciones
    ExcepcionCreateRequest,
    ExcepcionResponse,
    ExcepcionLoteCreateRequest,
    ExcepcionUpdateRequest,
    # Dashboard
    DashboardHSEResponse,
)
from app.services.hse_service import HseService

router = APIRouter(prefix="/hse", tags=["HSE"])


async def _ensure_sede_access(
    db: AsyncSession,
    current_user: Usuario,
    sede_id: int,
) -> None:
    roles = {r.rol.nombre for r in current_user.roles}
    if "ADMIN_GLOBAL" in roles or "ADMIN_HSE" in roles:
        return

    # Para usuarios operativos (vigilantes), la sede efectiva vive en Usuario.sede_asignada_id.
    if current_user.sede_asignada_id is not None:
        if current_user.sede_asignada_id != sede_id:
            err(
                "SIN_PERMISOS_SEDE",
                "No tienes permisos para operar sobre esta sede.",
                403,
            )
        return

    result = await db.execute(
        select(Perfil.sede_default_id)
        .where(
            Perfil.usuario_id == current_user.id,
            Perfil.deleted_at.is_(None),
        )
    )
    sede_default = result.scalar_one_or_none()

    if sede_default is None:
        err(
            "SIN_SEDE_ASIGNADA",
            "Tu usuario no tiene una sede por defecto configurada.",
            403,
        )

    if sede_default != sede_id:
        err(
            "SIN_PERMISOS_SEDE",
            "No tienes permisos para operar sobre esta sede.",
            403,
        )


async def _ensure_autorizacion_access(
    service: HseService,
    db: AsyncSession,
    current_user: Usuario,
    autorizacion_id: int,
) -> None:
    autorizacion = await service.get_autorizacion(autorizacion_id)
    await _ensure_sede_access(db, current_user, autorizacion.sede_id)


async def _ensure_contratista_access(
    service: HseService,
    db: AsyncSession,
    current_user: Usuario,
    contratista_id: int,
) -> None:
    contratista = await service.get_contratista_detalle(contratista_id)
    autorizacion = await service.get_autorizacion(contratista.autorizacion_id)
    await _ensure_sede_access(db, current_user, autorizacion.sede_id)


# ═══════════════════════════════════════════════════════════════════
# CATÁLOGOS
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/catalogos/eps",
    response_model=ApiResponse[list[CatItemResponse]],
    summary="Listar EPS activas",
)
async def listar_eps(
    db: AsyncSession = Depends(get_db),
):
    service = HseService(db)
    return ok(await service.get_eps())

@router.get(
    "/catalogos/proveedores",
    response_model=ApiResponse[list[ProveedorHSEOptionResponse]],
    summary="Catálogo de proveedores activos",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE", "VISUALIZADOR"))],
)
async def catalogo_proveedores(
    db: AsyncSession = Depends(get_db),
):
    service = HseService(db)
    return ok(await service.get_proveedores())


@router.post(
    "/catalogos/proveedores",
    response_model=ApiResponse[ProveedorHSEOptionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Crear proveedor para flujo HSE",
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_HSE"))],
)
async def crear_proveedor_hse(
    body: ProveedorHSECreateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        result = await service.crear_proveedor_hse(body)
        return ok(result, message="Proveedor creado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.put(
    "/catalogos/proveedores/{proveedor_id}",
    response_model=ApiResponse[ProveedorHSEOptionResponse],
    summary="Actualizar proveedor HSE",
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_HSE"))],
)
async def actualizar_proveedor_hse(
    proveedor_id: int,
    body: ProveedorHSEUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        result = await service.actualizar_proveedor_hse(proveedor_id, body)
        return ok(result, message="Proveedor actualizado correctamente.")
    except HseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/catalogos/proveedores/{proveedor_id}",
    response_model=ApiResponse[None],
    summary="Eliminar (soft-delete) proveedor HSE",
    dependencies=[Depends(require_role("ADMIN_GLOBAL", "ADMIN_HSE"))],
)
async def eliminar_proveedor_hse(
    proveedor_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        await service.eliminar_proveedor_hse(proveedor_id)
        return ok(None, message="Proveedor eliminado correctamente.")
    except HseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get(
    "/catalogos/arl",
    response_model=ApiResponse[list[CatItemResponse]],
    summary="Listar ARL activas",
)
async def listar_arl(
    db: AsyncSession = Depends(get_db),
):
    service = HseService(db)
    return ok(await service.get_arl())


@router.get(
    "/catalogos/afp",
    response_model=ApiResponse[list[CatItemResponse]],
    summary="Listar AFP activas",
)
async def listar_afp(
    db: AsyncSession = Depends(get_db),
):
    service = HseService(db)
    return ok(await service.get_afp())


@router.get(
    "/catalogos/sedes",
    response_model=ApiResponse[list[SedeBasicaResponse]],
    summary="Listar sedes activas",
)
async def listar_sedes(
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    roles = {r.rol.nombre for r in current_user.roles}
    service = HseService(db)
    sedes = await service.get_sedes()

    # ADMIN_GLOBAL y ADMIN_HSE pueden operar transversalmente en todas las sedes.
    if "ADMIN_GLOBAL" in roles or "ADMIN_HSE" in roles:
        return ok(sedes)

    if current_user.sede_asignada_id is not None:
        return ok([s for s in sedes if s.id == current_user.sede_asignada_id])

    result = await db.execute(
        select(Perfil.sede_default_id).where(
            Perfil.usuario_id == current_user.id,
            Perfil.deleted_at.is_(None),
        )
    )
    sede_default = result.scalar_one_or_none()

    if sede_default is None:
        return ok([])

    return ok([s for s in sedes if s.id == sede_default])


@router.get(
    "/catalogos/normas/{sede_id}",
    response_model=ApiResponse[list[NormaResponse]],
    summary="Listar normas de seguridad por sede",
)
async def listar_normas(sede_id: int, db: AsyncSession = Depends(get_db)):
    """Público — usado en el portal de autogestión."""
    service = HseService(db)
    return ok(await service.get_normas(sede_id))


# ═══════════════════════════════════════════════════════════════════
# PANEL GENERAL — Autorizaciones
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/autorizaciones",
    response_model=ApiResponse[list[AutorizacionListResponse]],
    summary="Listar autorizaciones por sede",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE", "VISUALIZADOR"))],
)
async def listar_autorizaciones(
    sede_id:      int,
    estado:       str | None = None,
    page:         int = Query(1, ge=1),
    per_page:     int = Query(20, ge=1, le=100),
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, sede_id)
    service = HseService(db)
    skip    = (page - 1) * per_page
    items, total = await service.listar_autorizaciones(sede_id, estado, skip, per_page)

    data = [AutorizacionListResponse.from_orm_with_counts(a) for a in items]
    return ok(data, message=f"{total} autorizaciones encontradas")


@router.post(
    "/autorizaciones",
    response_model=ApiResponse[AutorizacionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva autorización",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def crear_autorizacion(
    body:         AutorizacionCreateRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    try:
        await _ensure_sede_access(db, current_user, body.sede_id)
        service = HseService(db)
        result  = await service.crear_autorizacion(body, current_user.id)
        return ok(result, message="Autorización creada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.get(
    "/autorizaciones/{autorizacion_id}",
    response_model=ApiResponse[AutorizacionResponse],
    summary="Obtener detalle de autorización",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE", "VISUALIZADOR"))],
)
async def get_autorizacion(
    autorizacion_id: int,
    db:              AsyncSession = Depends(get_db),
    current_user:    Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_autorizacion_access(service, db, current_user, autorizacion_id)
        return ok(await service.get_autorizacion(autorizacion_id))
    except ValueError as e:
        err("HSE_ERROR", str(e), 404)


@router.put(
    "/autorizaciones/{autorizacion_id}",
    response_model=ApiResponse[AutorizacionResponse],
    summary="Actualizar autorización",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def actualizar_autorizacion(
    autorizacion_id: int,
    body:            AutorizacionUpdateRequest,
    db:              AsyncSession = Depends(get_db),
    current_user:    Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_autorizacion_access(service, db, current_user, autorizacion_id)
        return ok(await service.actualizar_autorizacion(autorizacion_id, body))
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.delete(
    "/autorizaciones/{autorizacion_id}",
    response_model=ApiResponse[None],
    summary="Eliminar autorización",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def eliminar_autorizacion(
    autorizacion_id: int,
    db:              AsyncSession = Depends(get_db),
    current_user:    Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_autorizacion_access(service, db, current_user, autorizacion_id)
        await service.eliminar_autorizacion(autorizacion_id)
        return ok(None, message="Autorización eliminada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


# ═══════════════════════════════════════════════════════════════════
# GESTIÓN HSE — Contratistas
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/contratistas/{contratista_id}",
    response_model=ApiResponse[ContratistaDetalleResponse],
    summary="Ver detalle completo del contratista",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def get_contratista(
    contratista_id: int,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        return ok(await service.get_contratista_detalle(contratista_id))
    except ValueError as e:
        err("HSE_ERROR", str(e), 404)


@router.post(
    "/contratistas/{contratista_id}/aprobar",
    response_model=ApiResponse[None],
    summary="Aprobar contratista",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def aprobar_contratista(
    contratista_id: int,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        await service.aprobar_contratista(contratista_id, current_user.id)
        return ok(None, message="Contratista aprobado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/contratistas/{contratista_id}/denegar",
    response_model=ApiResponse[None],
    summary="Denegar contratista",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def denegar_contratista(
    contratista_id: int,
    body:           ContratistaDenegarRequest,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        await service.denegar_contratista(contratista_id, body, current_user.id)
        return ok(None, message="Contratista denegado. El link fue reactivado.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/contratistas/{contratista_id}/token",
    response_model=ApiResponse[str],
    summary="Renovar token de autogestión",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def renovar_token(
    contratista_id: int,
    body:           ContratistaTokenRequest,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
):
    try:
        service     = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        nuevo_token = await service.renovar_token(contratista_id, body)
        return ok(nuevo_token, message="Token renovado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/contratistas/{contratista_id}/eliminar",
    response_model=ApiResponse[None],
    summary="Eliminar contratista de una autorización (con trazabilidad)",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def eliminar_contratista(
    contratista_id: int,
    body:           ContratistaEliminarRequest,
    db:             AsyncSession = Depends(get_db),
    current_user:   Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        await service.eliminar_contratista(contratista_id, body, current_user.id)
        return ok(None, message="Contratista eliminado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.put(
    "/contratistas/{contratista_id}/proveedor",
    response_model=ApiResponse[ContratistaDetalleResponse],
    summary="Actualizar proveedor/empresa del contratista",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def actualizar_proveedor_contratista(
    contratista_id: int,
    body: ContratistaActualizarProveedorRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        result = await service.actualizar_proveedor_contratista(contratista_id, body)
        return ok(result, message="Proveedor del contratista actualizado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/contratistas/{contratista_id}/adjuntos/eliminar",
    response_model=ApiResponse[ContratistaDetalleResponse],
    summary="Eliminar adjunto del contratista en revisión HSE",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def eliminar_adjunto_contratista(
    contratista_id: int,
    body: ContratistaEliminarAdjuntoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await _ensure_contratista_access(service, db, current_user, contratista_id)
        result = await service.eliminar_adjunto_contratista(contratista_id, body)
        return ok(result, message="Adjunto eliminado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


# ═══════════════════════════════════════════════════════════════════
# PORTAL AUTOGESTIÓN — Público (token)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/autogestion/{token}",
    response_model=ApiResponse[AutogestionValidarTokenResponse],
    summary="Validar token e iniciar wizard",
)
async def validar_token(
    token: str,
    db:    AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        return ok(await service.get_autogestion_token_data(token))
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/upload",
    response_model=ApiResponse[UploadArchivoResponse],
    summary="Subir archivo PDF para el wizard de autogestión",
)
async def subir_archivo_autogestion(
    token:   str,
    modulo:  str = Form(...),
    campo:   str = Form(...),
    archivo: UploadFile = File(...),
    db:      AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result = await service.subir_archivo_autogestion(
            contratista_id=contratista.id,
            modulo=modulo,
            campo=campo,
            archivo=archivo,
        )
        return ok(result, message="Archivo cargado correctamente.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/datos-personales",
    response_model=ApiResponse[None],
    summary="Paso 2 — Guardar datos personales",
)
async def guardar_datos_personales(
    token:   str,
    body:    DatosPersonalesRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        await service.guardar_datos_personales(contratista.id, body)
        return ok(None, message="Datos personales guardados.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/clasificacion",
    response_model=ApiResponse[ClasificacionResponse],
    summary="Paso 3 — Guardar clasificación de actividad",
)
async def guardar_clasificacion(
    token:   str,
    body:    ClasificacionRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result      = await service.guardar_clasificacion(contratista.id, body)
        return ok(result, message="Clasificación guardada.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/seguridad-social",
    response_model=ApiResponse[list[SegSocialResponse]],
    summary="Paso 4 — Guardar seguridad social",
)
async def guardar_seguridad_social(
    token:   str,
    body:    SegSocialRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result      = await service.guardar_seguridad_social(contratista.id, body)
        return ok(result, message="Seguridad social guardada.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/certificaciones",
    response_model=ApiResponse[CertificacionesResponse],
    summary="Paso 5 — Guardar certificaciones",
)
async def guardar_certificaciones(
    token:   str,
    body:    CertificacionesRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result      = await service.guardar_certificaciones(contratista.id, body)
        return ok(result, message="Certificaciones guardadas.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/examen-medico",
    response_model=ApiResponse[ExamenMedicoResponse],
    summary="Paso 6 — Guardar examen médico",
)
async def guardar_examen_medico(
    token:   str,
    body:    ExamenMedicoRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result      = await service.guardar_examen_medico(contratista.id, body)
        return ok(result, message="Examen médico guardado.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/contacto-emergencia",
    response_model=ApiResponse[ContactoEmergenciaResponse],
    summary="Paso 7 — Guardar contacto de emergencia",
)
async def guardar_contacto_emergencia(
    token:   str,
    body:    ContactoEmergenciaRequest,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        result      = await service.guardar_contacto_emergencia(contratista.id, body)
        return ok(result, message="Contacto de emergencia guardado.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


@router.post(
    "/autogestion/{token}/normas",
    response_model=ApiResponse[AceptacionNormasResponse],
    summary="Paso 8 — Aceptar normas y completar autogestión",
)
async def aceptar_normas(
    token:   str,
    body:    AceptacionNormasRequest,
    request: Request,
    db:      AsyncSession = Depends(get_db),
):
    try:
        service     = HseService(db)
        contratista = await service.validar_token_autogestion_editable(token)
        ip          = request.client.host if request.client else None
        result      = await service.guardar_aceptacion_normas(contratista.id, body, ip)
        return ok(result, message="Autogestión completada. El administrador revisará tu información.")
    except HseNotFoundError as e:
        err("TOKEN_ERROR", str(e), 404)
    except ValueError as e:
        err("TOKEN_ERROR", str(e), 400)


# ═══════════════════════════════════════════════════════════════════
# PORTAL VIGILANTE
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/vigilante/verificar",
    response_model=ApiResponse[VerificarAccesoResponse],
    summary="Verificar acceso por cédula",
    dependencies=[Depends(require_role("VIGILANTE_HSE", "ADMIN_HSE"))],
)
async def verificar_acceso(
    body:         VerificarAccesoRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, body.sede_id)
    service = HseService(db)
    result  = await service.verificar_acceso(body)
    return ok(result)


@router.post(
    "/vigilante/acceso",
    response_model=ApiResponse[AccesoResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Registrar entrada o salida",
    dependencies=[Depends(require_role("VIGILANTE_HSE", "ADMIN_HSE"))],
)
async def registrar_acceso(
    body:         RegistrarAccesoRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    try:
        await _ensure_sede_access(db, current_user, body.sede_id)
        service = HseService(db)
        result  = await service.registrar_acceso(body, current_user.id)
        return ok(result, message=f"{body.tipo} registrada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.get(
    "/vigilante/dentro/{sede_id}",
    response_model=ApiResponse[list[PersonaDentroResponse]],
    summary="Personas actualmente dentro de la sede",
    dependencies=[Depends(require_role("VIGILANTE_HSE", "ADMIN_HSE", "GESTION_HSE", "VISUALIZADOR"))],
)
async def personas_dentro(
    sede_id:      int,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, sede_id)
    service = HseService(db)
    result  = await service.get_personas_dentro(sede_id)
    return ok(result)


# ═══════════════════════════════════════════════════════════════════
# CUMPLIMIENTO
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/cumplimiento",
    response_model=ApiResponse[list[CumplimientoListadoResponse]],
    summary="Listar verificaciones de cumplimiento",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def listar_cumplimientos(
    sede_id: int = Query(..., ge=1),
    estado: str | None = Query(None, pattern="^(EN_PROGRESO|COMPLETADO|INCUMPLIMIENTO)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, sede_id)
    service = HseService(db)
    return ok(await service.listar_cumplimientos(sede_id, estado))

@router.post(
    "/cumplimiento/iniciar",
    response_model=ApiResponse[CumplimientoResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar registro de cumplimiento",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def iniciar_cumplimiento(
    body:         CumplimientoIniciarRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    try:
        await _ensure_sede_access(db, current_user, body.sede_id)
        service = HseService(db)
        result  = await service.iniciar_cumplimiento(body, current_user.id)
        return ok(result, message="Registro de cumplimiento iniciado.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.get(
    "/cumplimiento/{cumplimiento_id}",
    response_model=ApiResponse[CumplimientoResponse],
    summary="Obtener detalle de un cumplimiento",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def obtener_cumplimiento(
    cumplimiento_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = HseService(db)
        result = await service.get_cumplimiento_detalle(cumplimiento_id)
        return ok(result)
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.put(
    "/cumplimiento/{cumplimiento_id}",
    response_model=ApiResponse[CumplimientoResponse],
    summary="Actualizar items del checklist",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def actualizar_cumplimiento(
    cumplimiento_id: int,
    body:            CumplimientoActualizarRequest,
    db:              AsyncSession = Depends(get_db),
    current_user:    Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        result  = await service.actualizar_cumplimiento(cumplimiento_id, body)
        return ok(result)
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/cumplimiento/{cumplimiento_id}/cerrar",
    response_model=ApiResponse[CumplimientoResponse],
    summary="Cerrar registro de cumplimiento",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def cerrar_cumplimiento(
    cumplimiento_id: int,
    body:            CumplimientoCerrarRequest,
    db:              AsyncSession = Depends(get_db),
    current_user:    Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        result  = await service.cerrar_cumplimiento(cumplimiento_id, body)
        return ok(result, message="Cumplimiento cerrado correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


# ═══════════════════════════════════════════════════════════════════
# EXCEPCIONES
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/excepciones/{sede_id}",
    response_model=ApiResponse[list[ExcepcionResponse]],
    summary="Listar excepciones por sede",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def listar_excepciones(
    sede_id:      int,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, sede_id)
    service = HseService(db)
    return ok(await service.listar_excepciones(sede_id))


@router.post(
    "/excepciones",
    response_model=ApiResponse[ExcepcionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Crear excepción HSE",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def crear_excepcion(
    body:         ExcepcionCreateRequest,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    try:
        await _ensure_sede_access(db, current_user, body.sede_id)
        service = HseService(db)
        result  = await service.crear_excepcion(body, current_user.id)
        return ok(result, message="Excepción creada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/excepciones/lote",
    response_model=ApiResponse[list[ExcepcionResponse]],
    status_code=status.HTTP_201_CREATED,
    summary="Crear excepciones masivas por empresa/proveedor",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def crear_excepciones_lote(
    body: ExcepcionLoteCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        await _ensure_sede_access(db, current_user, body.sede_id)
        service = HseService(db)
        result = await service.crear_excepciones_lote(body, current_user.id)
        return ok(result, message=f"Se crearon {len(result)} excepciones.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.get(
    "/excepciones/detalle/{excepcion_id}",
    response_model=ApiResponse[ExcepcionResponse],
    summary="Ver detalle de excepción",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def get_excepcion(
    excepcion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = HseService(db)
        excepcion = await service.get_excepcion(excepcion_id)
        await _ensure_sede_access(db, current_user, excepcion.sede_id)
        return ok(excepcion)
    except ValueError as e:
        err("HSE_ERROR", str(e), 404)


@router.put(
    "/excepciones/{excepcion_id}",
    response_model=ApiResponse[ExcepcionResponse],
    summary="Actualizar excepción (datos generales)",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def actualizar_excepcion(
    excepcion_id: int,
    body: ExcepcionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = HseService(db)
        excepcion = await service.get_excepcion(excepcion_id)
        await _ensure_sede_access(db, current_user, excepcion.sede_id)
        result = await service.actualizar_excepcion_fechas(excepcion_id, body)
        return ok(result, message="Excepción actualizada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)



@router.post(
    "/excepciones/{excepcion_id}/desactivar",
    response_model=ApiResponse[None],
    summary="Desactivar excepción",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def desactivar_excepcion(
    excepcion_id: int,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await service.desactivar_excepcion(excepcion_id)
        return ok(None, message="Excepción desactivada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


@router.post(
    "/excepciones/{excepcion_id}/activar",
    response_model=ApiResponse[None],
    summary="Activar excepción",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE"))],
)
async def activar_excepcion(
    excepcion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        service = HseService(db)
        await service.activar_excepcion(excepcion_id)
        return ok(None, message="Excepción activada correctamente.")
    except HseNotFoundError as e:
        err("HSE_ERROR", str(e), 404)
    except ValueError as e:
        err("HSE_ERROR", str(e), 400)


# ═══════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/dashboard/{sede_id}",
    response_model=ApiResponse[DashboardHSEResponse],
    summary="Métricas del dashboard HSE",
    dependencies=[Depends(require_role("ADMIN_HSE", "GESTION_HSE", "VIGILANTE_HSE", "VISUALIZADOR"))],
)
async def get_dashboard(
    sede_id:      int,
    db:           AsyncSession = Depends(get_db),
    current_user: Usuario      = Depends(get_current_user),
):
    await _ensure_sede_access(db, current_user, sede_id)
    service = HseService(db)
    return ok(await service.get_dashboard(sede_id))


# ═══════════════════════════════════════════════════════════════════
# ARCHIVOS — Servicio de archivos subidos en autogestión
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/archivos/{path:path}",
    summary="Servir archivo PDF de autogestión",
)
async def servir_archivo_hse(
    path: str,
    current_user: Usuario = Depends(get_current_user),
):
    """
    Sirve un archivo PDF subido durante la autogestión.
    Solo accesible por usuarios autenticados (ADMIN_HSE o superior).
    Incluye protección contra path traversal.
    """
    base = FilePath(settings.UPLOAD_DIR).resolve()
    target = (base / path).resolve()

    # Protección path traversal
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")

    return FileResponse(
        path=str(target),
        media_type="application/pdf",
        filename=target.name,
    )