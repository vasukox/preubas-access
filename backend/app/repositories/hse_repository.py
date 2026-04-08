"""
KOAJ Access v2.0 — Permoda S.A.S.
Repositorio del módulo HSE

Queries específicas para todas las tablas HSE.
Sigue el patrón: Router → Service → Repository → Model
"""

from datetime import datetime, timezone
from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.hse import (
    HseAutorizacion,
    HseContratista,
    HseClasificacion,
    HseSegSocial,
    HseCertificaciones,
    HseExamenMedico,
    HseContactoEmergencia,
    HseAceptacionNormas,
    HseAcceso,
    HseCumplimiento,
    HseCumplimientoItem,
    HseExcepcion,
    HseHistorial,
    CatEPS,
    CatARL,
    CatAFP,
    CatNormaSeguridad,
)
from app.models.sede import Sede
from app.models.persona import Proveedor
from app.repositories.base import BaseRepository


# ═══════════════════════════════════════════════════════════════════
# CATÁLOGOS
# ═══════════════════════════════════════════════════════════════════

class CatEPSRepository(BaseRepository[CatEPS]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CatEPS, db)

    async def get_activas(self) -> list[CatEPS]:
        result = await self._db.execute(
            select(CatEPS)
            .where(CatEPS.activa == True, CatEPS.deleted_at == None)  # noqa
            .order_by(CatEPS.nombre)
        )
        return list(result.scalars().all())


class CatARLRepository(BaseRepository[CatARL]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CatARL, db)

    async def get_activas(self) -> list[CatARL]:
        result = await self._db.execute(
            select(CatARL)
            .where(CatARL.activa == True, CatARL.deleted_at == None)  # noqa
            .order_by(CatARL.nombre)
        )
        return list(result.scalars().all())


class CatAFPRepository(BaseRepository[CatAFP]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CatAFP, db)

    async def get_activas(self) -> list[CatAFP]:
        result = await self._db.execute(
            select(CatAFP)
            .where(CatAFP.activa == True, CatAFP.deleted_at == None)  # noqa
            .order_by(CatAFP.nombre)
        )
        return list(result.scalars().all())


class NormasRepository(BaseRepository[CatNormaSeguridad]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(CatNormaSeguridad, db)

    async def get_por_sede(self, sede_id: int) -> list[CatNormaSeguridad]:
        """Retorna normas de la sede + normas globales (sede_id=None)."""
        result = await self._db.execute(
            select(CatNormaSeguridad)
            .where(
                CatNormaSeguridad.activa == True,      # noqa
                CatNormaSeguridad.deleted_at == None,  # noqa
                (CatNormaSeguridad.sede_id == sede_id) |
                (CatNormaSeguridad.sede_id == None),   # noqa
            )
            .order_by(CatNormaSeguridad.numero)
        )
        return list(result.scalars().all())


class SedeRepository(BaseRepository[Sede]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Sede, db)

    async def get_activas(self) -> list[Sede]:
        result = await self._db.execute(
            select(Sede)
            .where(
                Sede.activa == True,      # noqa
                Sede.deleted_at == None,  # noqa
            )
            .order_by(Sede.nombre)
        )
        return list(result.scalars().all())


class ProveedorRepository(BaseRepository[Proveedor]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Proveedor, db)

    async def get_activos(self) -> list[Proveedor]:
        result = await self._db.execute(
            select(Proveedor)
            .where(
                Proveedor.estado_prov == True,   # noqa
                Proveedor.deleted_at == None,    # noqa
            )
            .order_by(Proveedor.nom_proveedor)
        )
        return list(result.scalars().all())

    async def contar_autorizaciones_asociadas(self, proveedor_id: int) -> int:
        result = await self._db.execute(
            select(func.count(HseAutorizacion.id))
            .where(
                HseAutorizacion.proveedor_id == proveedor_id,
                HseAutorizacion.deleted_at == None,  # noqa
            )
        )
        return int(result.scalar_one() or 0)

    async def contar_contratistas_asociados(self, proveedor_id: int) -> int:
        result = await self._db.execute(
            select(func.count(HseContratista.id))
            .join(
                HseAutorizacion,
                HseContratista.autorizacion_id == HseAutorizacion.id,
            )
            .where(
                HseAutorizacion.proveedor_id == proveedor_id,
                HseAutorizacion.deleted_at == None,  # noqa
                HseContratista.deleted_at == None,   # noqa
            )
        )
        return int(result.scalar_one() or 0)


# ═══════════════════════════════════════════════════════════════════
# AUTORIZACIONES
# ═══════════════════════════════════════════════════════════════════

class AutorizacionRepository(BaseRepository[HseAutorizacion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseAutorizacion, db)

    async def get_by_codigo(self, codigo: str) -> HseAutorizacion | None:
        result = await self._db.execute(
            select(HseAutorizacion)
            .where(
                HseAutorizacion.codigo     == codigo,
                HseAutorizacion.deleted_at == None,  # noqa
            )
        )
        return result.scalar_one_or_none()

    async def get_with_contratistas(self, autorizacion_id: int) -> HseAutorizacion | None:
        # populate_existing=True fuerza que SQLAlchemy refresque desde BD
        # en lugar de devolver objetos cacheados en el identity map de la sesión.
        # Esto es crítico cuando se llama después de un UPDATE bulk (cambiar_estado).
        result = await self._db.execute(
            select(HseAutorizacion)
            .options(selectinload(HseAutorizacion.contratistas))
            .where(
                HseAutorizacion.id         == autorizacion_id,
                HseAutorizacion.deleted_at == None,  # noqa
            )
            .execution_options(populate_existing=True)
        )
        return result.scalar_one_or_none()

    async def listar_por_sede(
        self,
        sede_id: int,
        estado:  str | None = None,
        skip:    int = 0,
        limit:   int = 20,
    ) -> list[HseAutorizacion]:
        query = (
            select(HseAutorizacion)
            .options(selectinload(HseAutorizacion.contratistas))
            .where(
                HseAutorizacion.sede_id    == sede_id,
                HseAutorizacion.deleted_at == None,  # noqa
            )
        )
        if estado:
            query = query.where(HseAutorizacion.estado == estado)

        query = query.order_by(HseAutorizacion.created_at.desc()).offset(skip).limit(limit)
        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def contar_por_sede(self, sede_id: int, estado: str | None = None) -> int:
        query = select(func.count(HseAutorizacion.id)).where(
            HseAutorizacion.sede_id    == sede_id,
            HseAutorizacion.deleted_at == None,  # noqa
        )
        if estado:
            query = query.where(HseAutorizacion.estado == estado)
        result = await self._db.execute(query)
        return result.scalar_one()

    async def generar_codigo(self, sede_id: int) -> str:
        """Genera código único HSE-YYYY-XXXX."""
        año = datetime.now(timezone.utc).year
        prefijo = f"HSE-{año}-"

        result = await self._db.execute(
            select(HseAutorizacion.codigo).where(
                HseAutorizacion.codigo.like(f"{prefijo}%")
            )
        )

        consecutivo = 1
        for codigo in result.scalars().all():
            try:
                sufijo = int(codigo.split("-")[-1])
                if sufijo >= consecutivo:
                    consecutivo = sufijo + 1
            except (ValueError, IndexError):
                continue

        return f"HSE-{año}-{consecutivo:04d}"

    async def cambiar_estado(
        self,
        autorizacion_id: int,
        nuevo_estado:    str,
        motivo:          str | None = None,
    ) -> None:
        values: dict = {"estado": nuevo_estado}
        if motivo:
            values["motivo_denegacion"] = motivo
        await self._db.execute(
            update(HseAutorizacion)
            .where(HseAutorizacion.id == autorizacion_id)
            .values(**values)
        )
        # Expirar solo el objeto afectado si está en el identity map,
        # evitando invalidar toda la sesión con expire_all().
        for instance in list(self._db.identity_map.values()):
            if isinstance(instance, HseAutorizacion) and instance.id == autorizacion_id:
                self._db.expire(instance)
                break


# ═══════════════════════════════════════════════════════════════════
# CONTRATISTAS
# ═══════════════════════════════════════════════════════════════════

class ContratistaRepository(BaseRepository[HseContratista]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseContratista, db)

    async def get_by_token(self, token: str) -> HseContratista | None:
        """Busca un contratista por su token de autogestión."""
        # Usar UTC_TIMESTAMP() de MySQL para evitar discrepancias de timezone
        # entre Python (aware/naive) y MySQL (DATETIME sin tzinfo).
        result = await self._db.execute(
            select(HseContratista)
            .where(
                HseContratista.token_autogestion == token,
                HseContratista.token_expira_en   >  func.utc_timestamp(),
                HseContratista.deleted_at        == None,  # noqa
            )
        )
        return result.scalar_one_or_none()

    async def get_by_documento_y_sede(
        self,
        numero_documento: str,
        sede_id:          int,
    ) -> HseContratista | None:
        """
        Busca un contratista APROBADO por documento en una sede.
        Usado por el vigilante al escanear la cédula.
        """
        result = await self._db.execute(
            select(HseContratista)
            .join(
                HseAutorizacion,
                HseContratista.autorizacion_id == HseAutorizacion.id,
            )
            .where(
                HseContratista.numero_documento == numero_documento,
                HseContratista.estado           == "APROBADO",
                HseContratista.deleted_at       == None,   # noqa
                HseAutorizacion.sede_id         == sede_id,
                HseAutorizacion.deleted_at      == None,   # noqa
            )
            .order_by(HseContratista.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_documento_y_sede_cualquiera(
        self,
        numero_documento: str,
        sede_id:          int,
    ) -> HseContratista | None:
        """
        Busca el contratista más reciente por documento en la sede,
        sin filtrar por estado.
        """
        result = await self._db.execute(
            select(HseContratista)
            .join(
                HseAutorizacion,
                HseContratista.autorizacion_id == HseAutorizacion.id,
            )
            .where(
                HseContratista.numero_documento == numero_documento,
                HseContratista.deleted_at       == None,   # noqa
                HseAutorizacion.sede_id         == sede_id,
                HseAutorizacion.deleted_at      == None,   # noqa
            )
            .order_by(HseContratista.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def contar_por_sede(
        self,
        sede_id: int,
        estado: str | None = None,
        tipo_contratista: str | None = None,
    ) -> int:
        query = (
            select(func.count(HseContratista.id))
            .join(
                HseAutorizacion,
                HseContratista.autorizacion_id == HseAutorizacion.id,
            )
            .where(
                HseAutorizacion.sede_id    == sede_id,
                HseAutorizacion.deleted_at == None,  # noqa
                HseContratista.deleted_at  == None,  # noqa
            )
        )

        if estado:
            query = query.where(HseContratista.estado == estado)

        if tipo_contratista:
            query = query.where(HseAutorizacion.tipo_contratista == tipo_contratista)

        result = await self._db.execute(query)
        return result.scalar_one()

    async def get_detalle_completo(self, contratista_id: int) -> HseContratista | None:
        """Carga el contratista con todas sus subtablas."""
        result = await self._db.execute(
            select(HseContratista)
            .options(
                selectinload(HseContratista.clasificacion),
                selectinload(HseContratista.seguridad_social),
                selectinload(HseContratista.certificaciones),
                selectinload(HseContratista.examen_medico),
                selectinload(HseContratista.contacto_emergencia),
                selectinload(HseContratista.aceptacion_normas),
                selectinload(HseContratista.historial),
            )
            .where(
                HseContratista.id         == contratista_id,
                HseContratista.deleted_at == None,  # noqa
            )
        )
        return result.scalar_one_or_none()

    async def cambiar_estado(
        self,
        contratista_id: int,
        nuevo_estado:   str,
        motivo:         str | None = None,
    ) -> None:
        values: dict = {"estado": nuevo_estado}
        if motivo:
            values["motivo_denegacion"] = motivo
        await self._db.execute(
            update(HseContratista)
            .where(HseContratista.id == contratista_id)
            .values(**values)
        )
        # Expirar solo el objeto afectado si está en el identity map,
        # evitando invalidar toda la sesión con expire_all().
        for instance in list(self._db.identity_map.values()):
            if isinstance(instance, HseContratista) and instance.id == contratista_id:
                self._db.expire(instance)
                break

    async def actualizar_token(
        self,
        contratista_id:  int,
        token:           str,
        expira_en:       datetime,
        duracion_horas:  int,
    ) -> None:
        await self._db.execute(
            update(HseContratista)
            .where(HseContratista.id == contratista_id)
            .values(
                token_autogestion    = token,
                token_expira_en      = expira_en,
                token_duracion_horas = duracion_horas,
            )
        )

    async def marcar_autogestion_completada(self, contratista_id: int) -> None:
        await self._db.execute(
            update(HseContratista)
            .where(HseContratista.id == contratista_id)
            .values(
                autogestion_completada_en = datetime.now(timezone.utc),
                estado                   = "AUTOGESTION_COMPLETADA",
            )
        )


# ═══════════════════════════════════════════════════════════════════
# AUTOGESTIÓN — Subtablas
# ═══════════════════════════════════════════════════════════════════

class ClasificacionRepository(BaseRepository[HseClasificacion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseClasificacion, db)

    async def get_by_contratista(self, contratista_id: int) -> HseClasificacion | None:
        result = await self._db.execute(
            select(HseClasificacion)
            .where(HseClasificacion.contratista_id == contratista_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        contratista_id: int,
        datos:          dict,
    ) -> HseClasificacion:
        """Crea o actualiza la clasificación del contratista."""
        existente = await self.get_by_contratista(contratista_id)
        if existente:
            for key, value in datos.items():
                setattr(existente, key, value)
            return await self.update(existente)
        else:
            nueva = HseClasificacion(contratista_id=contratista_id, **datos)
            return await self.create(nueva)


class SegSocialRepository(BaseRepository[HseSegSocial]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseSegSocial, db)

    async def get_by_contratista(self, contratista_id: int) -> list[HseSegSocial]:
        result = await self._db.execute(
            select(HseSegSocial)
            .where(HseSegSocial.contratista_id == contratista_id)
            .order_by(HseSegSocial.es_titular.desc())
        )
        return list(result.scalars().all())

    async def eliminar_por_contratista(self, contratista_id: int) -> None:
        """Elimina todos los registros para reemplazarlos."""
        registros = await self.get_by_contratista(contratista_id)
        for reg in registros:
            await self.hard_delete(reg)


class CertificacionesRepository(BaseRepository[HseCertificaciones]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseCertificaciones, db)

    async def get_by_contratista(self, contratista_id: int) -> HseCertificaciones | None:
        result = await self._db.execute(
            select(HseCertificaciones)
            .where(HseCertificaciones.contratista_id == contratista_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, contratista_id: int, datos: dict) -> HseCertificaciones:
        existente = await self.get_by_contratista(contratista_id)
        if existente:
            for key, value in datos.items():
                setattr(existente, key, value)
            return await self.update(existente)
        else:
            nueva = HseCertificaciones(contratista_id=contratista_id, **datos)
            return await self.create(nueva)


class ExamenMedicoRepository(BaseRepository[HseExamenMedico]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseExamenMedico, db)

    async def get_by_contratista(self, contratista_id: int) -> HseExamenMedico | None:
        result = await self._db.execute(
            select(HseExamenMedico)
            .where(HseExamenMedico.contratista_id == contratista_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, contratista_id: int, datos: dict) -> HseExamenMedico:
        existente = await self.get_by_contratista(contratista_id)
        if existente:
            for key, value in datos.items():
                setattr(existente, key, value)
            return await self.update(existente)
        else:
            nuevo = HseExamenMedico(contratista_id=contratista_id, **datos)
            return await self.create(nuevo)


class ContactoEmergenciaRepository(BaseRepository[HseContactoEmergencia]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseContactoEmergencia, db)

    async def get_by_contratista(self, contratista_id: int) -> HseContactoEmergencia | None:
        result = await self._db.execute(
            select(HseContactoEmergencia)
            .where(HseContactoEmergencia.contratista_id == contratista_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, contratista_id: int, datos: dict) -> HseContactoEmergencia:
        existente = await self.get_by_contratista(contratista_id)
        if existente:
            for key, value in datos.items():
                setattr(existente, key, value)
            return await self.update(existente)
        else:
            nuevo = HseContactoEmergencia(contratista_id=contratista_id, **datos)
            return await self.create(nuevo)


class AceptacionNormasRepository(BaseRepository[HseAceptacionNormas]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseAceptacionNormas, db)

    async def get_by_contratista(self, contratista_id: int) -> HseAceptacionNormas | None:
        result = await self._db.execute(
            select(HseAceptacionNormas)
            .where(HseAceptacionNormas.contratista_id == contratista_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, contratista_id: int, datos: dict) -> HseAceptacionNormas:
        existente = await self.get_by_contratista(contratista_id)
        if existente:
            for key, value in datos.items():
                setattr(existente, key, value)
            return await self.update(existente)
        else:
            nuevo = HseAceptacionNormas(contratista_id=contratista_id, **datos)
            return await self.create(nuevo)


# ═══════════════════════════════════════════════════════════════════
# ACCESOS
# ═══════════════════════════════════════════════════════════════════

class AccesoRepository(BaseRepository[HseAcceso]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseAcceso, db)

    async def get_ultimo_acceso(self, contratista_id: int) -> HseAcceso | None:
        """Retorna el último acceso registrado del contratista."""
        result = await self._db.execute(
            select(HseAcceso)
            .where(HseAcceso.contratista_id == contratista_id)
            .order_by(HseAcceso.fecha_hora.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def esta_dentro(self, contratista_id: int) -> bool:
        """Verifica si el contratista está actualmente dentro."""
        ultimo = await self.get_ultimo_acceso(contratista_id)
        if not ultimo:
            return False
        return ultimo.tipo == "ENTRADA"

    async def get_personas_dentro(self, sede_id: int) -> list[HseAcceso]:
        """
        Retorna el acceso de entrada más reciente por contratista en la sede,
        pero solo si ese último acceso es de tipo ENTRADA (persona aún dentro).
        """
        # Subquery: fecha del último acceso por contratista en esta sede
        ultimo_acceso_subq = (
            select(
                HseAcceso.contratista_id,
                func.max(HseAcceso.fecha_hora).label("max_fecha"),
            )
            .where(HseAcceso.sede_id == sede_id)
            .group_by(HseAcceso.contratista_id)
            .subquery()
        )
        result = await self._db.execute(
            select(HseAcceso)
            .join(
                ultimo_acceso_subq,
                and_(
                    HseAcceso.contratista_id == ultimo_acceso_subq.c.contratista_id,
                    HseAcceso.fecha_hora     == ultimo_acceso_subq.c.max_fecha,
                ),
            )
            .where(
                HseAcceso.sede_id == sede_id,
                HseAcceso.tipo    == "ENTRADA",
            )
            .order_by(HseAcceso.fecha_hora.asc())
        )
        return list(result.scalars().all())

    async def contar_ingresos_hoy(self, sede_id: int) -> int:
        from datetime import date
        hoy = date.today()
        result = await self._db.execute(
            select(func.count(HseAcceso.id)).where(
                HseAcceso.sede_id == sede_id,
                HseAcceso.tipo    == "ENTRADA",
                func.date(HseAcceso.fecha_hora) == hoy,
            )
        )
        return result.scalar_one()


# ═══════════════════════════════════════════════════════════════════
# CUMPLIMIENTO
# ═══════════════════════════════════════════════════════════════════

class CumplimientoRepository(BaseRepository[HseCumplimiento]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseCumplimiento, db)

    async def get_activo_por_contratista(
        self,
        contratista_id: int,
    ) -> HseCumplimiento | None:
        """Retorna el cumplimiento en progreso del contratista."""
        result = await self._db.execute(
            select(HseCumplimiento)
            .options(selectinload(HseCumplimiento.items))
            .where(
                HseCumplimiento.contratista_id == contratista_id,
                HseCumplimiento.estado         == "EN_PROGRESO",
                HseCumplimiento.deleted_at     == None,  # noqa
            )
        )
        return result.scalar_one_or_none()

    async def get_with_items(self, cumplimiento_id: int) -> HseCumplimiento | None:
        result = await self._db.execute(
            select(HseCumplimiento)
            .options(selectinload(HseCumplimiento.items))
            .where(HseCumplimiento.id == cumplimiento_id)
        )
        return result.scalar_one_or_none()

    async def listar_por_sede(
        self,
        sede_id: int,
        estado: str | None = None,
    ) -> list[HseCumplimiento]:
        query = (
            select(HseCumplimiento)
            .options(
                selectinload(HseCumplimiento.items),
                selectinload(HseCumplimiento.contratista).selectinload(HseContratista.autorizacion),
            )
            .where(
                HseCumplimiento.sede_id == sede_id,
                HseCumplimiento.deleted_at == None,  # noqa
            )
            .order_by(HseCumplimiento.created_at.desc())
        )
        if estado:
            query = query.where(HseCumplimiento.estado == estado)

        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def existe_por_autorizacion(self, autorizacion_id: int) -> bool:
        result = await self._db.execute(
            select(func.count(HseCumplimiento.id))
            .join(
                HseContratista,
                HseCumplimiento.contratista_id == HseContratista.id,
            )
            .where(
                HseContratista.autorizacion_id == autorizacion_id,
                HseContratista.deleted_at == None,  # noqa
                HseCumplimiento.deleted_at == None,  # noqa
            )
        )
        return int(result.scalar_one() or 0) > 0


class CumplimientoItemRepository(BaseRepository[HseCumplimientoItem]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseCumplimientoItem, db)

    async def get_by_cumplimiento(
        self,
        cumplimiento_id: int,
    ) -> list[HseCumplimientoItem]:
        result = await self._db.execute(
            select(HseCumplimientoItem)
            .where(HseCumplimientoItem.cumplimiento_id == cumplimiento_id)
            .order_by(HseCumplimientoItem.orden)
        )
        return list(result.scalars().all())


# ═══════════════════════════════════════════════════════════════════
# EXCEPCIONES
# ═══════════════════════════════════════════════════════════════════

class ExcepcionRepository(BaseRepository[HseExcepcion]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseExcepcion, db)

    async def get_activa_por_persona(
        self,
        persona_id: int,
        sede_id:    int,
    ) -> HseExcepcion | None:
        hoy = datetime.now(timezone.utc).date()
        result = await self._db.execute(
            select(HseExcepcion).where(
                HseExcepcion.persona_id   == persona_id,
                HseExcepcion.sede_id      == sede_id,
                HseExcepcion.activa       == True,       # noqa
                HseExcepcion.fecha_inicio <= hoy,
                HseExcepcion.fecha_fin    >= hoy,
                HseExcepcion.deleted_at   == None,       # noqa
            )
        )
        return result.scalar_one_or_none()

    async def listar_por_sede(self, sede_id: int) -> list[HseExcepcion]:
        result = await self._db.execute(
            select(HseExcepcion)
            .where(
                HseExcepcion.sede_id    == sede_id,
                HseExcepcion.deleted_at == None,  # noqa
            )
            .order_by(HseExcepcion.created_at.desc())
        )
        return list(result.scalars().all())


# ═══════════════════════════════════════════════════════════════════
# HISTORIAL
# ═══════════════════════════════════════════════════════════════════

class HistorialRepository(BaseRepository[HseHistorial]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HseHistorial, db)

    async def get_por_contratista(
        self,
        contratista_id: int,
    ) -> list[HseHistorial]:
        result = await self._db.execute(
            select(HseHistorial)
            .where(HseHistorial.contratista_id == contratista_id)
            .order_by(HseHistorial.created_at.desc())
        )
        return list(result.scalars().all())

    async def registrar(
        self,
        contratista_id:  int,
        usuario_id:      int | None,
        estado_anterior: str | None,
        estado_nuevo:    str,
        motivo:          str | None = None,
        metadata:        dict | None = None,
    ) -> HseHistorial:
        """Registra un cambio de estado — inmutable."""
        entrada = HseHistorial(
            contratista_id  = contratista_id,
            usuario_id      = usuario_id,
            estado_anterior = estado_anterior,
            estado_nuevo    = estado_nuevo,
            motivo          = motivo,
            metadata_extra  = metadata,
        )
        return await self.create(entrada)