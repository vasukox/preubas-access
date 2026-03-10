"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Configuración de la base de datos.

Responsabilidades:
- Crear el engine de SQLAlchemy con connection pooling
- Proveer la clase Base para todos los modelos ORM
- Proveer la sesión de BD como dependencia de FastAPI (get_db)
- Verificar la conectividad al arrancar la aplicación

Patrón: todos los modelos importan Base desde aquí.
        todos los routers usan get_db() como dependencia.
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.pool import QueuePool

from app.config import settings

logger = logging.getLogger(__name__)


# ── Base declarativa ──────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Clase base para todos los modelos ORM del sistema.

    Todos los modelos en app/models/ heredan de esta clase.
    Ejemplo:
        from app.database import Base
        class Usuario(Base):
            __tablename__ = "usuarios"
    """
    pass


# ── Engine con connection pooling ─────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,

    # Número de conexiones permanentes en el pool
    pool_size=10,

    # Conexiones extra permitidas cuando el pool está lleno
    max_overflow=20,

    # Verifica que la conexión sigue viva antes de usarla
    # Previene el error "MySQL server has gone away"
    pool_pre_ping=True,

    # Recicla conexiones cada 1 hora para evitar conexiones muertas
    pool_recycle=3600,

    # Tiempo máximo de espera para obtener una conexión del pool (segundos)
    pool_timeout=30,

    # Muestra el SQL generado solo en desarrollo (muy útil para debug)
    echo=settings.DEBUG,
)


# ── Session factory ───────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,   # Siempre usar transacciones explícitas
    autoflush=False,    # No hacer flush automático antes de cada query
)


# ── Dependencia de FastAPI ────────────────────────────────────────────
def get_db():
    """
    Dependencia de FastAPI que provee una sesión de base de datos.

    Garantiza que:
    - La sesión se abre al inicio del request
    - Se hace rollback si ocurre cualquier excepción
    - La sesión se cierra siempre al final del request

    Uso en routers:
        from app.database import get_db
        from sqlalchemy.orm import Session
        from fastapi import Depends

        @router.get("/ejemplo")
        def mi_endpoint(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ── Health check de base de datos ─────────────────────────────────────
def check_db_connection() -> bool:
    """
    Verifica que la base de datos esté accesible.

    Usado en el startup de la app (lifespan) y en el
    endpoint /health para monitoreo.

    Returns:
        True si la conexión es exitosa, False si falla.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Conexión a base de datos verificada correctamente.")
        return True
    except Exception as e:
        logger.error(f"Error al conectar con la base de datos: {e}")
        return False


def create_all_tables() -> None:
    """
    Crea todas las tablas definidas en los modelos ORM.

    Solo para desarrollo/testing. En producción usar Alembic.
    Se llama desde el startup solo si ENVIRONMENT=development.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Tablas creadas correctamente (modo desarrollo).")