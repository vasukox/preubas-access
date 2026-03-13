"""
KOAJ Access v2.0 — Permoda S.A.S.
Configuración de la capa de persistencia asíncrona.

Este módulo centraliza la configuración de SQLAlchemy para interactuar con 
MySQL de forma no bloqueante, gestionando el ciclo de vida de las conexiones 
y las sesiones de la base de datos.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.config import settings

# Configuración del registrador de eventos (logs)
logger = logging.getLogger(__name__)


# ── BASE DECLARATIVA ──────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Clase base para el mapeo objeto-relacional (ORM).
    
    Todos los modelos definidos en 'app/models/' deben heredar de esta clase
    para que SQLAlchemy pueda rastrear los metadatos y generar las tablas.
    """
    pass


# ── CONFIGURACIÓN DEL MOTOR (ENGINE) ──────────────────────────────
# Transformamos la URL de conexión para usar el driver asíncrono 'aiomysql'
DATABASE_URL_ASYNC = settings.DATABASE_URL.replace(
    "mysql+pymysql://", "mysql+aiomysql://"
)

# El Engine es el punto de entrada real a la base de datos
engine = create_async_engine(
    DATABASE_URL_ASYNC,
    poolclass      = AsyncAdaptedQueuePool,  # Manejo de cola de conexiones asíncronas
    pool_size      = 10,     # Mantener hasta 10 conexiones abiertas constantes
    max_overflow   = 20,     # Permitir hasta 20 conexiones adicionales en picos de tráfico
    pool_pre_ping  = True,   # Verifica la salud de la conexión antes de usarla
    pool_recycle   = 3600,   # Reinicia conexiones cada hora para evitar timeouts del servidor
    pool_timeout   = 30,     # Tiempo máximo de espera para obtener una conexión del pool
    echo           = settings.DEBUG,  # Si es True, imprime todas las consultas SQL en consola
)


# ── FÁBRICA DE SESIONES ───────────────────────────────────────────
# AsyncSessionLocal actúa como un constructor de sesiones bajo demanda
AsyncSessionLocal = async_sessionmaker(
    bind             = engine,
    class_           = AsyncSession,
    autocommit       = False,
    autoflush        = False,
    expire_on_commit = False,  # Evita que los objetos queden obsoletos tras el commit
)


# ── DEPENDENCIAS DE FASTAPI ───────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Generador asíncrono (Dependency Injection) para FastAPI.
    
    Provee una sesión de base de datos única por cada petición HTTP y
    asegura su cierre o reversión (rollback) en caso de error.

    Yields:
        AsyncSession: Sesión activa de SQLAlchemy.
    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception as e:
            # Si ocurre un error en el request, deshacemos los cambios
            await db.rollback()
            logger.error(f"Error en la transacción de DB: {e}")
            raise
        finally:
            # La sesión se cierra automáticamente al salir del bloque 'async with'
            pass


# ── UTILIDADES DE MANTENIMIENTO ──────────────────────────────────
async def check_db_connection() -> bool:
    """
    Realiza una prueba de conectividad con la base de datos.
    
    Se utiliza típicamente durante el inicio de la aplicación (startup) 
    o en endpoints de monitoreo (/health).

    Returns:
        bool: True si la conexión es exitosa, False en caso contrario.
    """
    try:
        async with engine.connect() as conn:
            # Ejecutamos una consulta mínima de validación
            await conn.execute(text("SELECT 1"))
        logger.info("Conexión a base de datos verificada correctamente.")
        return True
    except Exception as e:
        logger.error(f"Fallo crítico en health check de base de datos: {e}")
        return False


async def create_all_tables() -> None:
    """
    Sincroniza los modelos de Python con el esquema de la base de datos.
    
    ¡IMPORTANTE!: Este método solo debe usarse en entornos locales de desarrollo.
    Para entornos de producción, se recomienda usar Alembic para migraciones controladas.
    """
    try:
        async with engine.begin() as conn:
            # run_sync permite ejecutar funciones síncronas (como create_all)
            # dentro del contexto asíncrono del motor.
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Esquema de tablas sincronizado exitosamente (Modo Desarrollo).")
    except Exception as e:
        logger.error(f"Error al intentar crear tablas: {e}")