"""
KOAJ Access v2.0 — Permoda S.A.S.
Repositorio base de Gestión Humana (GH).
"""

from datetime import datetime, timezone

from sqlalchemy import and_, func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.gh import (
    GhAccesoVigilancia,
    GhAuditoria,
    GhCandidato,
    GhCita,
    GhDotacionEntrega,
    GhDotacionEntregaDetalle,
    GhInduccionAsistencia,
    GhImportacion,
    GhImportacionDetalle,
    GhMaestroDotacion,
    GhPortalToken,
    GhSesionInduccion,
)
from app.repositories.base import BaseRepository


class GhCitaRepository(BaseRepository[GhCita]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhCita, db)
        self._db = db

    async def list_citas(
        self,
        *,
        sede_id: int,
        estado: str | None,
        tipo_cita: str | None,
        busqueda: str | None,
        fecha_desde: datetime | None,
        fecha_hasta: datetime | None,
        page: int,
        per_page: int,
    ) -> list[GhCita]:
        query = (
            select(GhCita)
            .options(selectinload(GhCita.candidato))
            .where(GhCita.deleted_at.is_(None), GhCita.sede_id == sede_id)
            .order_by(GhCita.fecha_hora_inicio.desc())
        )
        if estado:
            query = query.where(GhCita.estado == estado)
        if tipo_cita:
            if tipo_cita == "FIRMA_CONTRATO":
                query = query.where(GhCita.tipo_cita.in_(["FIRMA_CONTRATO", "ENTREVISTA"]))
            else:
                query = query.where(GhCita.tipo_cita == tipo_cita)
        if fecha_desde:
            query = query.where(GhCita.fecha_hora_inicio >= fecha_desde)
        if fecha_hasta:
            query = query.where(GhCita.fecha_hora_inicio <= fecha_hasta)
        if busqueda:
            query = query.join(GhCandidato, GhCandidato.id == GhCita.candidato_id)
            query = query.where(GhCandidato.deleted_at.is_(None))
            term = f"%{busqueda}%"
            query = query.where(
                or_(
                    GhCandidato.numero_documento.ilike(term),
                    GhCandidato.nombres.ilike(term),
                    GhCandidato.apellidos.ilike(term)
                )
            )

        offset = (page - 1) * per_page
        result = await self._db.execute(query.offset(offset).limit(per_page))
        return list(result.scalars().all())

    async def get_cita(self, cita_id: int) -> GhCita | None:
        result = await self._db.execute(
            select(GhCita)
            .options(selectinload(GhCita.candidato))
            .where(GhCita.id == cita_id, GhCita.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_cita_by_codigo(self, codigo: str) -> GhCita | None:
        result = await self._db.execute(
            select(GhCita)
            .options(selectinload(GhCita.candidato))
            .where(GhCita.codigo == codigo, GhCita.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def count_citas_hoy(self, sede_id: int, estado: str | None = None) -> int:
        today = datetime.now(timezone.utc).date()
        query = select(func.count(GhCita.id)).where(
            GhCita.deleted_at.is_(None),
            GhCita.sede_id == sede_id,
            func.date(GhCita.fecha_hora_inicio) == today,
        )
        if estado:
            query = query.where(GhCita.estado == estado)
        result = await self._db.execute(query)
        return result.scalar_one() or 0

    async def count_citas_en_curso(self, sede_id: int) -> int:
        now = datetime.now(timezone.utc)
        result = await self._db.execute(
            select(func.count(GhCita.id)).where(
                GhCita.deleted_at.is_(None),
                GhCita.sede_id == sede_id,
                GhCita.estado.in_(["CONFIRMADA", "EN_CURSO"]),
                GhCita.fecha_hora_inicio <= now,
                GhCita.fecha_hora_fin >= now,
            )
        )
        return result.scalar_one() or 0

    async def find_cita_para_vigilancia(
        self,
        *,
        sede_id: int,
        tipo_documento: str,
        numero_documento: str,
    ) -> GhCita | None:
        now = datetime.now(timezone.utc)
        result = await self._db.execute(
            select(GhCita)
            .join(GhCandidato, GhCandidato.id == GhCita.candidato_id)
            .options(selectinload(GhCita.candidato))
            .where(
                GhCita.deleted_at.is_(None),
                GhCandidato.deleted_at.is_(None),
                GhCita.sede_id == sede_id,
                GhCandidato.tipo_documento == tipo_documento,
                GhCandidato.numero_documento == numero_documento,
                GhCita.estado.in_(["PROGRAMADA", "CONFIRMADA", "EN_CURSO"]),
                GhCita.fecha_hora_inicio <= now,
                GhCita.fecha_hora_fin >= now,
            )
            .order_by(GhCita.fecha_hora_inicio.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_candidato(self, candidato: GhCandidato) -> GhCandidato:
        self._db.add(candidato)
        await self._db.flush()
        await self._db.refresh(candidato)
        return candidato

    async def get_candidato_by_documento(
        self,
        *,
        tipo_documento: str,
        numero_documento: str,
    ) -> GhCandidato | None:
        result = await self._db.execute(
            select(GhCandidato).where(
                GhCandidato.deleted_at.is_(None),
                GhCandidato.tipo_documento == tipo_documento,
                GhCandidato.numero_documento == numero_documento,
            )
        )
        return result.scalar_one_or_none()

    async def create_cita(self, cita: GhCita) -> GhCita:
        self._db.add(cita)
        await self._db.flush()
        await self._db.refresh(cita)
        return cita

    async def get_citas_by_ids(self, cita_ids: list[int]) -> list[GhCita]:
        if not cita_ids:
            return []
        result = await self._db.execute(
            select(GhCita)
            .options(selectinload(GhCita.candidato))
            .where(GhCita.id.in_(cita_ids), GhCita.deleted_at.is_(None))
        )
        return list(result.scalars().all())


class GhPortalTokenRepository(BaseRepository[GhPortalToken]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhPortalToken, db)
        self._db = db

    async def list_tokens_by_cita_id(self, cita_id: int) -> list[GhPortalToken]:
        result = await self._db.execute(
            select(GhPortalToken).where(
                GhPortalToken.cita_id == cita_id,
                GhPortalToken.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def get_token_activo(self, token: str) -> GhPortalToken | None:
        now = datetime.now(timezone.utc)
        result = await self._db.execute(
            select(GhPortalToken)
            .options(selectinload(GhPortalToken.cita).selectinload(GhCita.candidato))
            .where(
                GhPortalToken.token == token,
                GhPortalToken.deleted_at.is_(None),
                GhPortalToken.usado_en.is_(None),
                GhPortalToken.expira_en >= now,
            )
        )
        return result.scalar_one_or_none()

    async def create_token(self, token_obj: GhPortalToken) -> GhPortalToken:
        self._db.add(token_obj)
        await self._db.flush()
        await self._db.refresh(token_obj)
        return token_obj


class GhVigilanciaRepository(BaseRepository[GhAccesoVigilancia]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhAccesoVigilancia, db)
        self._db = db

    async def create_acceso(self, acceso: GhAccesoVigilancia) -> GhAccesoVigilancia:
        self._db.add(acceso)
        await self._db.flush()
        await self._db.refresh(acceso)
        return acceso


class GhImportacionRepository(BaseRepository[GhImportacion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhImportacion, db)
        self._db = db

    async def create_importacion(self, item: GhImportacion) -> GhImportacion:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def get_importacion(self, importacion_id: int) -> GhImportacion | None:
        result = await self._db.execute(
            select(GhImportacion)
            .options(selectinload(GhImportacion.detalles))
            .where(GhImportacion.id == importacion_id, GhImportacion.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def add_detalle(self, detalle: GhImportacionDetalle) -> GhImportacionDetalle:
        self._db.add(detalle)
        await self._db.flush()
        await self._db.refresh(detalle)
        return detalle


class GhAuditoriaRepository(BaseRepository[GhAuditoria]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhAuditoria, db)
        self._db = db

    async def log(
        self,
        *,
        usuario_id: int | None,
        sede_id: int | None,
        accion: str,
        entidad: str,
        entidad_id: int | None,
        detalle: dict | None,
    ) -> GhAuditoria:
        item = GhAuditoria(
            usuario_id=usuario_id,
            sede_id=sede_id,
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            detalle=detalle,
        )
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item


class GhInduccionRepository(BaseRepository[GhSesionInduccion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhSesionInduccion, db)
        self._db = db

    async def create_sesion(self, sesion: GhSesionInduccion) -> GhSesionInduccion:
        self._db.add(sesion)
        await self._db.flush()
        await self._db.refresh(sesion)
        return sesion

    async def add_asistencia(self, asistencia: GhInduccionAsistencia) -> GhInduccionAsistencia:
        self._db.add(asistencia)
        await self._db.flush()
        await self._db.refresh(asistencia)
        return asistencia

    async def list_sesiones(self, *, sede_id: int | None, estado_sesion: str | None) -> list[GhSesionInduccion]:
        query = (
            select(GhSesionInduccion)
            .options(selectinload(GhSesionInduccion.asistentes).selectinload(GhInduccionAsistencia.candidato))
            .where(GhSesionInduccion.deleted_at.is_(None))
            .order_by(GhSesionInduccion.fecha_hora_inicio.desc())
        )
        if sede_id is not None:
            query = query.where(GhSesionInduccion.sede_id == sede_id)
        if estado_sesion:
            query = query.where(GhSesionInduccion.estado_sesion == estado_sesion)

        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def get_sesion(self, sesion_id: int) -> GhSesionInduccion | None:
        result = await self._db.execute(
            select(GhSesionInduccion)
            .options(selectinload(GhSesionInduccion.asistentes).selectinload(GhInduccionAsistencia.candidato))
            .where(GhSesionInduccion.id == sesion_id, GhSesionInduccion.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_asistencia_by_token(self, token: str) -> GhInduccionAsistencia | None:
        result = await self._db.execute(
            select(GhInduccionAsistencia)
            .options(
                selectinload(GhInduccionAsistencia.candidato),
                selectinload(GhInduccionAsistencia.sesion),
            )
            .where(
                GhInduccionAsistencia.token_autogestion == token,
                GhInduccionAsistencia.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_related_session_for_cita(self, cita: GhCita) -> GhSesionInduccion | None:
        result = await self._db.execute(
            select(GhSesionInduccion)
            .join(GhInduccionAsistencia, GhInduccionAsistencia.sesion_id == GhSesionInduccion.id)
            .where(
                GhSesionInduccion.deleted_at.is_(None),
                GhInduccionAsistencia.deleted_at.is_(None),
                GhSesionInduccion.sede_id == cita.sede_id,
                GhInduccionAsistencia.candidato_id == cita.candidato_id,
                GhSesionInduccion.fecha_hora_inicio <= cita.fecha_hora_fin,
                GhSesionInduccion.fecha_hora_fin >= cita.fecha_hora_inicio,
            )
            .order_by(GhSesionInduccion.fecha_hora_inicio.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_related_cita_ids_for_session(self, sesion: GhSesionInduccion) -> list[int]:
        result = await self._db.execute(
            select(GhCita.id)
            .join(GhInduccionAsistencia, GhInduccionAsistencia.candidato_id == GhCita.candidato_id)
            .where(
                GhCita.deleted_at.is_(None),
                GhInduccionAsistencia.deleted_at.is_(None),
                GhCita.sede_id == sesion.sede_id,
                GhCita.tipo_cita == "INDUCCION",
                GhInduccionAsistencia.sesion_id == sesion.id,
                GhCita.fecha_hora_inicio <= sesion.fecha_hora_fin,
                GhCita.fecha_hora_fin >= sesion.fecha_hora_inicio,
            )
            .order_by(GhCita.fecha_hora_inicio.asc(), GhCita.id.asc())
        )
        return [row[0] for row in result.all()]


class GhDotacionRepository(BaseRepository[GhMaestroDotacion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(GhMaestroDotacion, db)
        self._db = db

    async def list_maestro(
        self,
        *,
        sede_id: int | None,
        area: str | None,
        cargo: str | None,
        tipo_contrato: str | None,
        activos_only: bool,
    ) -> list[GhMaestroDotacion]:
        query = (
            select(GhMaestroDotacion)
            .where(GhMaestroDotacion.deleted_at.is_(None))
            .order_by(GhMaestroDotacion.area.asc(), GhMaestroDotacion.cargo.asc())
        )
        if sede_id is not None:
            query = query.where(GhMaestroDotacion.sede_id == sede_id)
        if area:
            query = query.where(GhMaestroDotacion.area.ilike(f"%{area}%"))
        if cargo:
            query = query.where(GhMaestroDotacion.cargo.ilike(f"%{cargo}%"))
        if tipo_contrato:
            query = query.where(GhMaestroDotacion.tipo_contrato.ilike(f"%{tipo_contrato}%"))
        if activos_only:
            query = query.where(GhMaestroDotacion.activo.is_(True))

        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def create_maestro(self, item: GhMaestroDotacion) -> GhMaestroDotacion:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def get_maestro(self, item_id: int) -> GhMaestroDotacion | None:
        result = await self._db.execute(
            select(GhMaestroDotacion).where(
                GhMaestroDotacion.id == item_id,
                GhMaestroDotacion.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_entrega(self, item: GhDotacionEntrega) -> GhDotacionEntrega:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def add_detalle_entrega(self, item: GhDotacionEntregaDetalle) -> GhDotacionEntregaDetalle:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def list_entregas(self, estado: str | None) -> list[GhDotacionEntrega]:
        query = (
            select(GhDotacionEntrega)
            .options(selectinload(GhDotacionEntrega.detalles))
            .where(GhDotacionEntrega.deleted_at.is_(None))
            .order_by(GhDotacionEntrega.created_at.desc())
        )
        if estado:
            query = query.where(GhDotacionEntrega.estado_entrega == estado)

        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def get_entrega(self, entrega_id: int) -> GhDotacionEntrega | None:
        result = await self._db.execute(
            select(GhDotacionEntrega)
            .options(selectinload(GhDotacionEntrega.detalles))
            .where(GhDotacionEntrega.id == entrega_id, GhDotacionEntrega.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()
