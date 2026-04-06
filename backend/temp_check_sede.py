import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.sede import Sede

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Sede))
        sedes = result.scalars().all()
        print(f"Found {len(sedes)} sedes:")
        for s in sedes:
            print(f"ID: {s.id}, Nombre: {s.nombre}")

if __name__ == "__main__":
    asyncio.run(main())
