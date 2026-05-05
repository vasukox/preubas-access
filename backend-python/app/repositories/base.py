"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Repositorio base genérico.

Implementa las operaciones CRUD comunes para todos los modelos.
Cada módulo hereda de este repositorio y agrega sus propias
consultas específicas.

Patrón:
  Router → Service → Repository → Model

El repositorio es la ÚNICA capa que habla con la BD.
Los servicios nunca importan directamente los modelos ORM.
"""

from typing import Generic, TypeVar, Type, Any, Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import BaseModel

# TypeVar genérico para el modelo ORM
ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """
    Repositorio base con operaciones CRUD genéricas.

    Uso:
        class UsuarioRepository(BaseRepository[Usuario]):
            def __init__(self, db: AsyncSession):
                super().__init__(Usuario, db)

            async def get_by_email(self, email: str) -> Usuario | None:
                ...
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession) -> None:
        self._model = model
        self._db    = db

    # ── Lectura ───────────────────────────────────────────────────

    async def get_by_id(self, id: int) -> ModelType | None:
        """
        Retorna un registro por su PK.
        Retorna None si no existe o si fue soft-deleted.
        """
        result = await self._db.execute(
            select(self._model).where(
                self._model.id         == id,
                self._model.deleted_at == None,  # noqa: E711
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_including_deleted(self, id: int) -> ModelType | None:
        """
        Retorna un registro por su PK incluyendo los soft-deleted.
        Útil para auditoría y trazabilidad.
        """
        result = await self._db.execute(
            select(self._model).where(self._model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        skip:  int = 0,
        limit: int = 100,
    ) -> Sequence[ModelType]:
        """
        Retorna todos los registros activos (sin soft-delete).
        Soporta paginación con skip y limit.
        """
        result = await self._db.execute(
            select(self._model)
            .where(self._model.deleted_at == None)  # noqa: E711
            .offset(skip)
            .limit(limit)
            .order_by(self._model.created_at.desc())
        )
        return result.scalars().all()

    async def count(self, *filters: Any) -> int:
        """
        Cuenta registros activos. Acepta filtros adicionales.

        Ejemplo:
            total = await repo.count(Usuario.activo == True)
        """
        query = select(func.count(self._model.id)).where(
            self._model.deleted_at == None,  # noqa: E711
            *filters,
        )
        result = await self._db.execute(query)
        return result.scalar_one()

    # ── Escritura ─────────────────────────────────────────────────

    async def create(self, obj: ModelType) -> ModelType:
        """
        Persiste un nuevo registro en la BD.
        El objeto debe estar construido antes de llamar este método.

        Ejemplo:
            usuario = Usuario(email=..., password_hash=...)
            usuario = await repo.create(usuario)
        """
        self._db.add(obj)
        await self._db.flush()   # obtiene el ID sin hacer commit
        await self._db.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        """
        Persiste los cambios de un objeto ya existente.
        El objeto debe haber sido modificado antes de llamar este método.

        Ejemplo:
            usuario.activo = False
            usuario = await repo.update(usuario)
        """
        self._db.add(obj)
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> ModelType:
        """
        Soft delete — establece deleted_at con el timestamp actual.
        El registro permanece en la BD para trazabilidad.
        """
        from datetime import datetime, timezone
        obj.deleted_at = datetime.now(timezone.utc)
        self._db.add(obj)
        await self._db.flush()
        return obj

    async def hard_delete(self, obj: ModelType) -> None:
        """
        Elimina físicamente el registro de la BD.
        Usar SOLO para datos temporales o en tests.
        NUNCA usar en producción para datos de negocio.
        """
        await self._db.delete(obj)
        await self._db.flush()

    # ── Helpers ───────────────────────────────────────────────────

    async def exists(self, *filters: Any) -> bool:
        """
        Retorna True si existe al menos un registro activo
        que cumpla los filtros dados.

        Ejemplo:
            existe = await repo.exists(Usuario.email == email)
        """
        result = await self._db.execute(
            select(func.count(self._model.id)).where(
                self._model.deleted_at == None,  # noqa: E711
                *filters,
            )
        )
        return (result.scalar_one() or 0) > 0