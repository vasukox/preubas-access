"""
KOAJ Access v2.0 — Permoda S.A.S.
Router Configuración — Fase 1.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.schemas.common import ApiResponse, err, ok
from app.schemas.config import (
    CatalogoItemCreateRequest,
    CatalogoItemResponse,
    CatalogoItemUpdateRequest,
    GlobalParamsResponse,
    NormaConfigResponse,
    NormaCreateRequest,
    NormaUpdateRequest,
    SedeCreateRequest,
    SedeResponse,
    SedeUpdateRequest,
    UbicacionCreateRequest,
    UbicacionResponse,
    UbicacionUpdateRequest,
)
from app.services.config_service import ConfigService


router = APIRouter(
    prefix="/api/v1/config",
    tags=["Configuración"],
    dependencies=[Depends(require_role("ADMIN_GLOBAL"))],
)


@router.get("/sistema", response_model=ApiResponse[GlobalParamsResponse], summary="Parámetros globales")
async def get_global_params(db: AsyncSession = Depends(get_db)):
    service = ConfigService(db)
    return ok(await service.get_global_params())


@router.get("/sedes", response_model=ApiResponse[list[SedeResponse]], summary="Listar sedes")
async def listar_sedes(db: AsyncSession = Depends(get_db)):
    service = ConfigService(db)
    return ok(await service.listar_sedes())


@router.post("/sedes", response_model=ApiResponse[SedeResponse], status_code=status.HTTP_201_CREATED, summary="Crear sede")
async def crear_sede(body: SedeCreateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.crear_sede(body), message="Sede creada correctamente.")
    except ValueError as e:
        err("CONFIG_ERROR", str(e), 400)


@router.put("/sedes/{sede_id}", response_model=ApiResponse[SedeResponse], summary="Actualizar sede")
async def actualizar_sede(sede_id: int, body: SedeUpdateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.actualizar_sede(sede_id, body), message="Sede actualizada correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)


@router.get("/ubicaciones", response_model=ApiResponse[list[UbicacionResponse]], summary="Listar ubicaciones")
async def listar_ubicaciones(
    sede_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = ConfigService(db)
    return ok(await service.listar_ubicaciones(sede_id))


@router.post("/ubicaciones", response_model=ApiResponse[UbicacionResponse], status_code=status.HTTP_201_CREATED, summary="Crear ubicación")
async def crear_ubicacion(body: UbicacionCreateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.crear_ubicacion(body), message="Ubicación creada correctamente.")
    except ValueError as e:
        err("CONFIG_ERROR", str(e), 400)


@router.put("/ubicaciones/{ubicacion_id}", response_model=ApiResponse[UbicacionResponse], summary="Actualizar ubicación")
async def actualizar_ubicacion(ubicacion_id: int, body: UbicacionUpdateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.actualizar_ubicacion(ubicacion_id, body), message="Ubicación actualizada correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)


@router.get("/catalogos/{catalogo}", response_model=ApiResponse[list[CatalogoItemResponse]], summary="Listar catálogo EPS/ARL/AFP")
async def listar_catalogo(catalogo: str, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.listar_catalogo(catalogo.lower()))
    except ValueError as e:
        err("CONFIG_ERROR", str(e), 400)


@router.post("/catalogos/{catalogo}", response_model=ApiResponse[CatalogoItemResponse], status_code=status.HTTP_201_CREATED, summary="Crear ítem catálogo")
async def crear_catalogo_item(catalogo: str, body: CatalogoItemCreateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.crear_catalogo_item(catalogo.lower(), body), message="Ítem creado correctamente.")
    except ValueError as e:
        err("CONFIG_ERROR", str(e), 400)


@router.put("/catalogos/{catalogo}/{item_id}", response_model=ApiResponse[CatalogoItemResponse], summary="Actualizar ítem catálogo")
async def actualizar_catalogo_item(
    catalogo: str,
    item_id: int,
    body: CatalogoItemUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ConfigService(db)
        return ok(await service.actualizar_catalogo_item(catalogo.lower(), item_id, body), message="Ítem actualizado correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)


@router.delete("/catalogos/{catalogo}/{item_id}", response_model=ApiResponse[None], summary="Eliminar ítem catálogo")
async def eliminar_catalogo_item(
    catalogo: str,
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        service = ConfigService(db)
        await service.eliminar_catalogo_item(catalogo.lower(), item_id)
        return ok(None, message="Ítem eliminado correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)


@router.get("/normas", response_model=ApiResponse[list[NormaConfigResponse]], summary="Listar normas de seguridad")
async def listar_normas(
    sede_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    service = ConfigService(db)
    return ok(await service.listar_normas(sede_id))


@router.post("/normas", response_model=ApiResponse[NormaConfigResponse], status_code=status.HTTP_201_CREATED, summary="Crear norma")
async def crear_norma(body: NormaCreateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.crear_norma(body), message="Norma creada correctamente.")
    except ValueError as e:
        err("CONFIG_ERROR", str(e), 400)


@router.put("/normas/{norma_id}", response_model=ApiResponse[NormaConfigResponse], summary="Actualizar norma")
async def actualizar_norma(norma_id: int, body: NormaUpdateRequest, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        return ok(await service.actualizar_norma(norma_id, body), message="Norma actualizada correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)


@router.delete("/normas/{norma_id}", response_model=ApiResponse[None], summary="Eliminar norma")
async def eliminar_norma(norma_id: int, db: AsyncSession = Depends(get_db)):
    try:
        service = ConfigService(db)
        await service.eliminar_norma(norma_id)
        return ok(None, message="Norma eliminada correctamente.")
    except ValueError as e:
        status_code = 404 if "no existe" in str(e).lower() else 400
        err("CONFIG_ERROR", str(e), status_code)
