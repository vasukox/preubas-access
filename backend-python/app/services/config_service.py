"""
KOAJ Access v2.0 — Permoda S.A.S.
Servicio de Configuración (Fase 1).
"""

from datetime import datetime, timezone
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.hse import CatAFP, CatARL, CatEPS, CatNormaSeguridad
from app.models.sede import Sede, Ubicacion
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


CATALOGO_MODEL_MAP = {
    "eps": CatEPS,
    "arl": CatARL,
    "afp": CatAFP,
}


class ConfigService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def _generar_codigo_sede(self, nombre: str) -> str:
        base = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii")
        base = re.sub(r"[^A-Za-z0-9]+", "-", base).strip("-").upper()
        if not base:
            base = "SEDE"
        base = base[:20]

        result = await self._db.execute(
            select(Sede.codigo).where(
                Sede.deleted_at.is_(None),
                Sede.codigo.like(f"{base}%"),
            )
        )
        existing = {x for x in result.scalars().all() if x}
        if base not in existing:
            return base

        idx = 2
        while True:
            suffix = f"-{idx}"
            candidate = f"{base[: max(1, 20 - len(suffix))]}{suffix}"
            if candidate not in existing:
                return candidate
            idx += 1

    async def get_global_params(self) -> GlobalParamsResponse:
        return GlobalParamsResponse(
            access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
            max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
            allowed_origins=settings.allowed_origins_list,
            debug=settings.DEBUG,
            environment=settings.ENVIRONMENT,
        )

    async def listar_sedes(self) -> list[SedeResponse]:
        result = await self._db.execute(
            select(Sede)
            .options(selectinload(Sede.ubicaciones))
            .where(Sede.deleted_at.is_(None))
            .order_by(Sede.nombre)
        )
        sedes = result.scalars().all()

        response: list[SedeResponse] = []
        for s in sedes:
            ubicaciones = [
                UbicacionResponse.model_validate(u)
                for u in s.ubicaciones
                if u.deleted_at is None
            ]
            response.append(
                SedeResponse(
                    id=s.id,
                    nombre=s.nombre,
                    codigo=s.codigo,
                    ciudad=s.ciudad,
                    direccion=s.direccion,
                    telefono=s.telefono,
                    activa=s.activa,
                    capacidad_carros=s.capacidad_carros,
                    capacidad_motos=s.capacidad_motos,
                    capacidad_bicis=s.capacidad_bicis,
                    aplica_pico_placa=s.aplica_pico_placa,
                    notas=s.notas,
                    ubicaciones=ubicaciones,
                )
            )
        return response

    async def crear_sede(self, data: SedeCreateRequest) -> SedeResponse:
        codigo = (data.codigo or "").strip().upper()
        if not codigo:
            codigo = await self._generar_codigo_sede(data.nombre)

        existing = await self._db.execute(
            select(Sede).where(
                Sede.deleted_at.is_(None),
                (Sede.nombre == data.nombre) | (Sede.codigo == codigo),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Ya existe una sede con ese nombre o código.")

        sede = Sede(
            nombre=data.nombre,
            codigo=codigo,
            ciudad=data.ciudad,
            direccion=data.direccion,
            telefono=data.telefono,
            activa=data.activa,
            capacidad_carros=data.capacidad_carros,
            capacidad_motos=data.capacidad_motos,
            capacidad_bicis=data.capacidad_bicis,
            aplica_pico_placa=data.aplica_pico_placa,
            notas=data.notas,
        )
        self._db.add(sede)
        await self._db.commit()
        await self._db.refresh(sede)
        return SedeResponse(
            id=sede.id,
            nombre=sede.nombre,
            codigo=sede.codigo,
            ciudad=sede.ciudad,
            direccion=sede.direccion,
            telefono=sede.telefono,
            activa=sede.activa,
            capacidad_carros=sede.capacidad_carros,
            capacidad_motos=sede.capacidad_motos,
            capacidad_bicis=sede.capacidad_bicis,
            aplica_pico_placa=sede.aplica_pico_placa,
            notas=sede.notas,
            ubicaciones=[],
        )

    async def actualizar_sede(self, sede_id: int, data: SedeUpdateRequest) -> SedeResponse:
        sede = await self._db.get(Sede, sede_id)
        if not sede or sede.deleted_at is not None:
            raise ValueError("La sede no existe.")

        updates = data.model_dump(exclude_unset=True)
        if "nombre" in updates or "codigo" in updates:
            nombre = updates.get("nombre", sede.nombre)
            codigo = updates.get("codigo", sede.codigo)
            existing = await self._db.execute(
                select(Sede).where(
                    Sede.id != sede_id,
                    Sede.deleted_at.is_(None),
                    (Sede.nombre == nombre) | (Sede.codigo == codigo),
                )
            )
            if existing.scalar_one_or_none():
                raise ValueError("Ya existe otra sede con ese nombre o código.")

        for key, value in updates.items():
            setattr(sede, key, value)

        await self._db.commit()
        await self._db.refresh(sede)
        return SedeResponse(
            id=sede.id,
            nombre=sede.nombre,
            codigo=sede.codigo,
            ciudad=sede.ciudad,
            direccion=sede.direccion,
            telefono=sede.telefono,
            activa=sede.activa,
            capacidad_carros=sede.capacidad_carros,
            capacidad_motos=sede.capacidad_motos,
            capacidad_bicis=sede.capacidad_bicis,
            aplica_pico_placa=sede.aplica_pico_placa,
            notas=sede.notas,
            ubicaciones=[],
        )

    async def listar_ubicaciones(self, sede_id: int | None = None) -> list[UbicacionResponse]:
        query = select(Ubicacion).where(Ubicacion.deleted_at.is_(None))
        if sede_id is not None:
            query = query.where(Ubicacion.sede_id == sede_id)
        query = query.order_by(Ubicacion.sede_id, Ubicacion.nombre)
        result = await self._db.execute(query)
        return [UbicacionResponse.model_validate(u) for u in result.scalars().all()]

    async def crear_ubicacion(self, data: UbicacionCreateRequest) -> UbicacionResponse:
        sede = await self._db.get(Sede, data.sede_id)
        if not sede or sede.deleted_at is not None:
            raise ValueError("La sede indicada no existe.")

        ubicacion = Ubicacion(
            sede_id=data.sede_id,
            nombre=data.nombre,
            codigo=data.codigo,
            tipo=data.tipo,
            activa=data.activa,
            descripcion=data.descripcion,
        )
        self._db.add(ubicacion)
        await self._db.commit()
        await self._db.refresh(ubicacion)
        return UbicacionResponse.model_validate(ubicacion)

    async def actualizar_ubicacion(self, ubicacion_id: int, data: UbicacionUpdateRequest) -> UbicacionResponse:
        ubicacion = await self._db.get(Ubicacion, ubicacion_id)
        if not ubicacion or ubicacion.deleted_at is not None:
            raise ValueError("La ubicación no existe.")

        updates = data.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(ubicacion, key, value)

        await self._db.commit()
        await self._db.refresh(ubicacion)
        return UbicacionResponse.model_validate(ubicacion)

    async def listar_catalogo(self, catalogo: str) -> list[CatalogoItemResponse]:
        model = CATALOGO_MODEL_MAP.get(catalogo)
        if not model:
            raise ValueError("Catálogo no soportado. Usa eps, arl o afp.")

        result = await self._db.execute(
            select(model)
            .where(model.deleted_at.is_(None))
            .order_by(model.nombre)
        )
        return [CatalogoItemResponse.model_validate(x) for x in result.scalars().all()]

    async def crear_catalogo_item(self, catalogo: str, data: CatalogoItemCreateRequest) -> CatalogoItemResponse:
        model = CATALOGO_MODEL_MAP.get(catalogo)
        if not model:
            raise ValueError("Catálogo no soportado. Usa eps, arl o afp.")

        existing = await self._db.execute(
            select(model).where(
                model.deleted_at.is_(None),
                (model.nombre == data.nombre) | (model.codigo == data.codigo),
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Ya existe un registro con ese nombre o código.")

        item = model(nombre=data.nombre, codigo=data.codigo, activa=data.activa)
        self._db.add(item)
        await self._db.commit()
        await self._db.refresh(item)
        return CatalogoItemResponse.model_validate(item)

    async def actualizar_catalogo_item(
        self,
        catalogo: str,
        item_id: int,
        data: CatalogoItemUpdateRequest,
    ) -> CatalogoItemResponse:
        model = CATALOGO_MODEL_MAP.get(catalogo)
        if not model:
            raise ValueError("Catálogo no soportado. Usa eps, arl o afp.")

        item = await self._db.get(model, item_id)
        if not item or item.deleted_at is not None:
            raise ValueError("El registro no existe.")

        updates = data.model_dump(exclude_unset=True)
        if "nombre" in updates or "codigo" in updates:
            nombre = updates.get("nombre", item.nombre)
            codigo = updates.get("codigo", item.codigo)
            existing = await self._db.execute(
                select(model).where(
                    model.id != item_id,
                    model.deleted_at.is_(None),
                    (model.nombre == nombre) | (model.codigo == codigo),
                )
            )
            if existing.scalar_one_or_none():
                raise ValueError("Ya existe otro registro con ese nombre o código.")

        for key, value in updates.items():
            setattr(item, key, value)

        await self._db.commit()
        await self._db.refresh(item)
        return CatalogoItemResponse.model_validate(item)

    async def eliminar_catalogo_item(self, catalogo: str, item_id: int) -> None:
        model = CATALOGO_MODEL_MAP.get(catalogo)
        if not model:
            raise ValueError("Catálogo no soportado. Usa eps, arl o afp.")

        item = await self._db.get(model, item_id)
        if not item or item.deleted_at is not None:
            raise ValueError("El registro no existe.")

        item.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    async def listar_normas(self, sede_id: int | None = None) -> list[NormaConfigResponse]:
        query = select(CatNormaSeguridad).where(CatNormaSeguridad.deleted_at.is_(None))
        if sede_id is not None:
            query = query.where(
                (CatNormaSeguridad.sede_id == sede_id) | (CatNormaSeguridad.sede_id.is_(None))
            )
        query = query.order_by(CatNormaSeguridad.numero, CatNormaSeguridad.id)
        result = await self._db.execute(query)
        return [NormaConfigResponse.model_validate(n) for n in result.scalars().all()]

    async def crear_norma(self, data: NormaCreateRequest) -> NormaConfigResponse:
        if data.sede_id is not None:
            sede = await self._db.get(Sede, data.sede_id)
            if not sede or sede.deleted_at is not None:
                raise ValueError("La sede indicada no existe.")

        norma = CatNormaSeguridad(
            numero=data.numero,
            titulo=data.titulo,
            contenido=data.contenido,
            activa=data.activa,
            sede_id=data.sede_id,
        )
        self._db.add(norma)
        await self._db.commit()
        await self._db.refresh(norma)
        return NormaConfigResponse.model_validate(norma)

    async def actualizar_norma(self, norma_id: int, data: NormaUpdateRequest) -> NormaConfigResponse:
        norma = await self._db.get(CatNormaSeguridad, norma_id)
        if not norma or norma.deleted_at is not None:
            raise ValueError("La norma no existe.")

        updates = data.model_dump(exclude_unset=True)
        if "sede_id" in updates and updates["sede_id"] is not None:
            sede = await self._db.get(Sede, updates["sede_id"])
            if not sede or sede.deleted_at is not None:
                raise ValueError("La sede indicada no existe.")

        for key, value in updates.items():
            setattr(norma, key, value)

        await self._db.commit()
        await self._db.refresh(norma)
        return NormaConfigResponse.model_validate(norma)

    async def eliminar_norma(self, norma_id: int) -> None:
        norma = await self._db.get(CatNormaSeguridad, norma_id)
        if not norma or norma.deleted_at is not None:
            raise ValueError("La norma no existe.")

        norma.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()
