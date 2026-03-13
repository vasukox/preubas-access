"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Modelo base para todos los modelos ORM.

Define los campos comunes que tienen TODAS las tablas:
- id:         clave primaria autoincremental
- created_at: fecha de creación (automática)
- updated_at: fecha de última modificación (automática)
- deleted_at: soft delete — None = activo, fecha = eliminado
"""

from datetime import datetime
from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class BaseModel(Base):
    """
    Clase base abstracta para todos los modelos ORM de KOAJ Access.

    Uso:
        from app.models.base import BaseModel

        class Usuario(BaseModel):
            __tablename__ = "usuarios"
            email: Mapped[str] = mapped_column(...)
    """

    __abstract__ = True

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Clave primaria autoincremental",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Fecha y hora de creación (UTC)",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Fecha y hora de última modificación (UTC)",
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="Soft delete — None = activo, fecha = eliminado",
    )

    @property
    def is_deleted(self) -> bool:
        """Retorna True si el registro ha sido eliminado (soft delete)."""
        return self.deleted_at is not None

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"

