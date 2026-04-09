"""
Script de migración única: añade sede_asignada_id a la tabla usuarios.
Ejecutar UNA SOLA VEZ con:
    uv run python migrate_sede_asignada.py
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def main() -> None:
    async with engine.begin() as conn:
        # Verificar si la columna ya existe
        result = await conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "   AND TABLE_NAME = 'usuarios' "
                "   AND COLUMN_NAME = 'sede_asignada_id'"
            )
        )
        existe = result.scalar() > 0

        if existe:
            print("La columna 'sede_asignada_id' ya existe. Nada que hacer.")
            return

        print("Añadiendo columna 'sede_asignada_id' a la tabla 'usuarios'...")
        await conn.execute(
            text(
                "ALTER TABLE usuarios "
                "ADD COLUMN sede_asignada_id INT NULL DEFAULT NULL "
                "COMMENT 'Sede fija asignada al vigilante'"
            )
        )

        # FK separada (más compatible con MySQL)
        await conn.execute(
            text(
                "ALTER TABLE usuarios "
                "ADD CONSTRAINT fk_usuarios_sede_asignada "
                "FOREIGN KEY (sede_asignada_id) REFERENCES sedes(id) ON DELETE SET NULL"
            )
        )
        print("Migración completada correctamente.")


if __name__ == "__main__":
    asyncio.run(main())
