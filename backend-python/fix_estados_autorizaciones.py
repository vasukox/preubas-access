"""
Script de corrección — KOAJ Access v2.0
Recalcula el estado de todas las HseAutorizacion basándose en el estado
real de sus HseContratista. Útil para corregir datos desincronizados.

Uso:
  cd backend
  python fix_estados_autorizaciones.py
"""
import asyncio
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine
from app.models.hse import HseAutorizacion, HseContratista


def calcular_nuevo_estado(contratistas) -> str:
    estados = [c.estado for c in contratistas if c.deleted_at is None]
    if not estados:
        return "PENDIENTE_AUTOGESTION"

    if any(e in ("AUTOGESTION_COMPLETADA", "EN_REVISION") for e in estados):
        return "EN_REVISION"
    elif all(e == "APROBADO" for e in estados):
        return "APROBADO"
    elif all(e in ("APROBADO", "DENEGADO") for e in estados) and any(e == "APROBADO" for e in estados):
        return "APROBADO"
    elif all(e == "DENEGADO" for e in estados):
        return "DENEGADO"
    else:
        return "PENDIENTE_AUTOGESTION"


async def main():
    async with AsyncSession(engine) as db:
        result = await db.execute(
            select(HseAutorizacion)
            .options(selectinload(HseAutorizacion.contratistas))
            .where(HseAutorizacion.deleted_at == None)  # noqa
        )
        autorizaciones = result.scalars().all()

        cambios = 0
        for auth in autorizaciones:
            if not auth.contratistas:
                continue
            nuevo = calcular_nuevo_estado(auth.contratistas)
            if auth.estado != nuevo:
                print(f"  [{auth.codigo}] {auth.estado} → {nuevo}")
                await db.execute(
                    update(HseAutorizacion)
                    .where(HseAutorizacion.id == auth.id)
                    .values(estado=nuevo)
                )
                cambios += 1

        if cambios:
            await db.commit()
            print(f"\n✓ {cambios} autorizacion(es) actualizadas.")
        else:
            print("✓ Todos los estados ya estaban sincronizados.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
