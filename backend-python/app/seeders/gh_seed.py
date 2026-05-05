"""
Seed base para catálogos del módulo Gestión Humana (GH).
"""

from sqlalchemy.ext.asyncio import AsyncSession


async def seed_gh(db: AsyncSession) -> None:
    """
    Placeholder de seed GH.
    La implementación real poblará catálogos y checklist base por tipo de cita.
    """
    _ = db
