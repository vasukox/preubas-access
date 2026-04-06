"""
KOAJ Access v2.0 — Permoda S.A.S.
Seeder inicial

Crea los datos mínimos para arrancar el sistema:
  - Roles del sistema
  - Usuario ADMIN_GLOBAL inicial
  - Sede corporativa inicial

Uso:
    uv run python -m app.seeders.seed

Seguro de ejecutar múltiples veces — verifica existencia
antes de insertar (idempotente).
"""

import asyncio
import sys
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.usuario import Rol, RolNombre, Usuario, UsuarioRol
from app.models.sede import Sede
from app.models.hse import CatEPS, CatARL, CatAFP
from app.utils.password import hash_password


# ── Datos iniciales ───────────────────────────────────────────────

EPS_COLOMBIA = [
    {"nombre": "Sura EPS",                  "codigo": "EPS001"},
    {"nombre": "Compensar",                  "codigo": "EPS002"},
    {"nombre": "Nueva EPS",                  "codigo": "EPS003"},
    {"nombre": "Sanitas",                    "codigo": "EPS004"},
    {"nombre": "Salud Total",                "codigo": "EPS005"},
    {"nombre": "Famisanar",                  "codigo": "EPS006"},
    {"nombre": "Coosalud",                   "codigo": "EPS007"},
    {"nombre": "Mutual Ser",                 "codigo": "EPS008"},
    {"nombre": "Aliansalud",                 "codigo": "EPS009"},
    {"nombre": "Medimás",                    "codigo": "EPS010"},
    {"nombre": "Comfenalco Valle",           "codigo": "EPS011"},
    {"nombre": "Cajacopi Atlántico",         "codigo": "EPS012"},
    {"nombre": "Capresoca",                  "codigo": "EPS013"},
    {"nombre": "Comfachocó",                 "codigo": "EPS014"},
    {"nombre": "Magisterio (Fiduprevisora)", "codigo": "EPS015"},
]

ARL_COLOMBIA = [
    {"nombre": "Sura ARL",           "codigo": "ARL001"},
    {"nombre": "Positiva",           "codigo": "ARL002"},
    {"nombre": "Colmena Seguros",    "codigo": "ARL003"},
    {"nombre": "Bolívar ARL",        "codigo": "ARL004"},
    {"nombre": "Equidad Seguros",    "codigo": "ARL005"},
    {"nombre": "Liberty Seguros",    "codigo": "ARL006"},
    {"nombre": "Axxa Colpatria",     "codigo": "ARL007"},
    {"nombre": "Seguros del Estado", "codigo": "ARL008"},
]

AFP_COLOMBIA = [
    {"nombre": "Porvenir",        "codigo": "AFP001"},
    {"nombre": "Protección",      "codigo": "AFP002"},
    {"nombre": "Colfondos",       "codigo": "AFP003"},
    {"nombre": "Old Mutual",      "codigo": "AFP004"},
    {"nombre": "Colpensiones",    "codigo": "AFP005"},
]

ROLES_INICIALES: list[str] = [
    RolNombre.ADMIN_GLOBAL,
    RolNombre.ADMIN_HSE,
    RolNombre.GESTION_HSE,
    RolNombre.ADMIN_PARKING,
    RolNombre.ADMIN_NFC,
    RolNombre.ADMIN_GH,
    RolNombre.VIGILANTE_HSE,
    RolNombre.VIGILANTE_PARKING,
    RolNombre.VISUALIZADOR,
]

ADMIN_INICIAL = {
    "email":           "andres@permoda.com.co",
    "password":        "123456Thomas*",
    "nombre_completo": "Andrés Administrador Global",
}

SEDE_INICIAL = {
    "nombre":  "Corporativo Permoda",
    "codigo":  "CORP",
    "ciudad":  "Bogotá",
    "direccion": "Sede principal Permoda S.A.S.",
}


# ── Funciones de seed ─────────────────────────────────────────────

async def seed_roles(db: AsyncSession) -> dict[str, Rol]:
    """
    Crea los roles del sistema si no existen.
    Retorna un dict nombre → Rol para usar en pasos siguientes.
    """
    roles: dict[str, Rol] = {}

    for nombre in ROLES_INICIALES:
        result = await db.execute(
            select(Rol).where(Rol.nombre == nombre)
        )
        rol = result.scalar_one_or_none()

        if not rol:
            rol = Rol(nombre=nombre)
            db.add(rol)
            await db.flush()
            print(f"  ✅ Rol creado: {nombre}")
        else:
            print(f"  ⏭️  Rol ya existe: {nombre}")

        roles[nombre] = rol

    return roles


async def seed_sede(db: AsyncSession) -> Sede:
    """
    Crea la sede corporativa inicial si no existe.
    """
    result = await db.execute(
        select(Sede).where(Sede.codigo == SEDE_INICIAL["codigo"])
    )
    sede = result.scalar_one_or_none()

    if not sede:
        sede = Sede(
            nombre   = SEDE_INICIAL["nombre"],
            codigo   = SEDE_INICIAL["codigo"],
            ciudad   = SEDE_INICIAL["ciudad"],
            direccion = SEDE_INICIAL["direccion"],
            activa   = True,
        )
        db.add(sede)
        await db.flush()
        print(f"  ✅ Sede creada: {sede.nombre}")
    else:
        print(f"  ⏭️  Sede ya existe: {sede.nombre}")

    return sede


async def seed_admin(db: AsyncSession, roles: dict[str, Rol]) -> None:
    """
    Crea el usuario ADMIN_GLOBAL inicial si no existe
    y le asigna el rol correspondiente.
    """
    result = await db.execute(
        select(Usuario).where(Usuario.email == ADMIN_INICIAL["email"])
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        usuario = Usuario(
            email                 = ADMIN_INICIAL["email"],
            password_hash         = hash_password(ADMIN_INICIAL["password"]),
            nombre_completo       = ADMIN_INICIAL["nombre_completo"],
            activo                = True,
            debe_cambiar_password = True,  # fuerza cambio en primer login
        )
        db.add(usuario)
        await db.flush()
        print(f"  ✅ Admin creado: {usuario.email}")

        # Asignar rol ADMIN_GLOBAL
        rol_admin = roles[RolNombre.ADMIN_GLOBAL]
        usuario_rol = UsuarioRol(
            usuario_id   = usuario.id,
            rol_id       = rol_admin.id,
            asignado_por = usuario.id,  # se asigna a sí mismo en el seed
        )
        db.add(usuario_rol)
        print(f"  ✅ Rol asignado: {RolNombre.ADMIN_GLOBAL} → {usuario.email}")
    else:
        print(f"  ⏭️  Admin ya existe: {usuario.email}")


async def seed_catalogos_hse(db: AsyncSession) -> None:
    """
    Carga EPS, ARL y AFP colombianas si las tablas están vacías.
    """
    for Model, datos, nombre_cat in [
        (CatEPS, EPS_COLOMBIA, "EPS"),
        (CatARL, ARL_COLOMBIA, "ARL"),
        (CatAFP, AFP_COLOMBIA, "AFP"),
    ]:
        for item in datos:
            result = await db.execute(
                select(Model).where(Model.codigo == item["codigo"])  # type: ignore[attr-defined]
            )
            existing = result.scalar_one_or_none()
            if not existing:
                db.add(Model(nombre=item["nombre"], codigo=item["codigo"], activa=True))  # type: ignore[call-arg]
                print(f"  ✅ {nombre_cat}: {item['nombre']}")
            else:
                print(f"  ⏭️  {nombre_cat} ya existe: {item['nombre']}")
        await db.flush()


# ── Runner principal ──────────────────────────────────────────────

async def run_seed() -> None:
    """
    Ejecuta el seed completo en orden correcto.
    """
    print("\n🌱 KOAJ Access v2.0 — Iniciando seed...\n")

    async with AsyncSessionLocal() as db:
        try:
            print("📋 Creando roles...")
            roles = await seed_roles(db)

            print("\n🏢 Creando sede inicial...")
            await seed_sede(db)

            print("\n👤 Creando administrador inicial...")
            await seed_admin(db, roles)

            print("\n🏥 Cargando catálogos HSE (EPS / ARL / AFP)...")
            await seed_catalogos_hse(db)

            await db.commit()
            print("\n✅ Seed completado exitosamente.")
            print("\n📌 Credenciales iniciales:")
            print(f"   Email:    {ADMIN_INICIAL['email']}")
            print(f"   Password: {ADMIN_INICIAL['password']}")
            print("   ⚠️  Cambia la contraseña en el primer login.\n")

        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error en seed: {e}")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_seed())