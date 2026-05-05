"""
seed_roles.py
─────────────────────────────────────────────────────────────────
Script de sincronización del catálogo de roles.
Inserta los roles que faltan en cat_roles sin duplicar los existentes.

Uso:
    uv run python seed_roles.py
"""

import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.usuario import Rol

ROLES_REQUERIDOS = [
    "ADMIN_GLOBAL",
    "ADMIN_HSE",
    "ADMIN_PARKING",
    "ADMIN_NFC",
    "ADMIN_GH",
    "VIGILANTE_HSE",
    "VIGILANTE_PARKING",
    "VISUALIZADOR",
    "GESTION_HSE",       # ← el que faltaba
]

DESCRIPCIONES = {
    "ADMIN_GLOBAL":      "Acceso total al sistema.",
    "ADMIN_HSE":         "Administración completa del módulo HSE.",
    "ADMIN_PARKING":     "Administración del módulo de Parking.",
    "ADMIN_NFC":         "Administración del módulo de Activos NFC.",
    "ADMIN_GH":          "Administración del módulo de Gestión Humana.",
    "VIGILANTE_HSE":     "Operación de portería HSE.",
    "VIGILANTE_PARKING": "Operación de portería de Parking.",
    "VISUALIZADOR":      "Solo lectura de reportes y dashboards.",
    "GESTION_HSE":       "Gestión documental de autorizaciones HSE.",
}


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Rol))
        existentes = {r.nombre for r in result.scalars().all()}

        insertados = []
        for nombre in ROLES_REQUERIDOS:
            if nombre not in existentes:
                rol = Rol(
                    nombre=nombre,
                    descripcion=DESCRIPCIONES.get(nombre, ""),
                    activo=True,
                )
                db.add(rol)
                insertados.append(nombre)

        if insertados:
            await db.commit()
            print(f"✅ Roles insertados: {insertados}")
        else:
            print("✅ Todos los roles ya existen. Nada que hacer.")


if __name__ == "__main__":
    asyncio.run(main())
