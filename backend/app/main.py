"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Punto de entrada principal de la aplicación FastAPI.

Responsabilidades:
- Crear y configurar la instancia de FastAPI
- Registrar todos los middlewares
- Registrar todos los routers (se irán agregando sprint a sprint)
- Manejar el ciclo de vida (startup y shutdown)
- Manejar excepciones globales con respuestas en formato estándar
- Exponer endpoints de health check y documentación

Orden de imports crítico:
    1. config    → No depende de nada interno
    2. database  → Depende de config
    3. models    → Dependen de database (Base)
    4. schemas   → Dependen de models
    5. routers   → Dependen de todo lo anterior
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError, ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import check_db_connection, create_all_tables
from app.schemas.common import ok

# ── Logging ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Ciclo de vida ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ───────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"  Entorno : {settings.ENVIRONMENT}")
    logger.info(f"  Debug   : {settings.DEBUG}")
    logger.info("=" * 60)

    logger.info("Verificando conexión a la base de datos...")
    if not await check_db_connection():
        logger.error("No se pudo conectar a la base de datos.")
        raise RuntimeError(
            "No se pudo conectar a la base de datos. "
            "Verifica DATABASE_URL en el archivo .env"
        )

    if settings.is_development:
        logger.info("Modo desarrollo: creando tablas si no existen...")
        try:
            from app.models import usuario, sede, persona, hse  # noqa: F401 — registra todos los modelos en Base.metadata
            # Asegurar que UsuarioPermiso y AuditLog estén registrados
            from app.models.usuario import UsuarioPermiso, AuditLog  # noqa: F401
            await create_all_tables()
            logger.info("Tablas verificadas correctamente.")
        except Exception as e:
            logger.warning(f"No se pudieron crear las tablas: {e}")

    logger.info("Aplicación lista para recibir peticiones.")

    yield

    # ── SHUTDOWN ──────────────────────────────────────────────────
    logger.info("Cerrando aplicación...")
    logger.info("Aplicación cerrada correctamente.")


# ── Instancia principal ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## KOAJ Access v2.0 — Sistema Inteligente de Control de Accesos

API REST para el sistema de control de accesos de **Permoda S.A.S.**

### Módulos
- 🔐 **Autenticación** — JWT con refresh tokens y RBAC por sede
- 👤 **Personas** — CRUD de personas y empresas
- 🚶 **Accesos Peatonales** — Registro de ingresos y salidas
- 🚗 **Parking** — Autogestión, administración y LPR
- 🦺 **HSE** — Autorizaciones de seguridad y salud
- 📡 **Activos NFC** — Inventario y trazabilidad con chips NFC
- 👔 **Gestión Humana** — Citas e importación Midassoft
- 📊 **Reportes** — Dashboard ejecutivo y generador de reportes

### Autenticación
Todos los endpoints (excepto login y portales públicos) requieren:
```
Authorization: Bearer <access_token>
```
    """,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)


# ── Middlewares ───────────────────────────────────────────────────────
# CORS — Debe ser el PRIMERO en registrarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=(r"^https?://(localhost|127\.0\.0\.1)(:\\d+)?$" if settings.is_development else None),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
)

# Trusted hosts — Solo en producción
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["koajaccess.permoda.com", "*.permoda.com"],
    )


# ── Manejadores de excepciones globales ───────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """
    Convierte HTTPException al formato estándar del sistema.

    FastAPI por defecto envuelve el detail en {"detail": ...}.
    Este handler lo entrega directamente como {"success": false, "error": {...}}
    para que getErrorMessage() del frontend pueda leerlo correctamente.
    """
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        content = exc.detail
    else:
        content = {
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
            },
        }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    Convierte los errores de validación de Pydantic al formato estándar.

    Por defecto FastAPI retorna un formato diferente para errores 422.
    Este handler lo unifica con el envelope ApiError del sistema.

    Ejemplo de respuesta:
        {
            "success": false,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "El campo 'placa' es requerido"
            }
        }
    """
    # Tomar el primer error de validación como mensaje principal
    errors = exc.errors()
    first_error = errors[0] if errors else {}

    # Construir mensaje legible
    field = " → ".join(str(loc) for loc in first_error.get("loc", []))
    msg = first_error.get("msg", "Error de validación")
    message = f"{field}: {msg}" if field else msg

    logger.debug(f"Error de validación en {request.url}: {errors}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "details": errors if settings.DEBUG else None,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """
    Captura cualquier excepción no manejada.

    En desarrollo muestra el detalle del error.
    En producción muestra un mensaje genérico (sin exponer internals).
    Siempre loguea el error completo para debugging.
    """
    logger.exception(
        "Error no manejado en %s %s",
        request.method,
        request.url,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "ERROR_INTERNO",
                "message": repr(exc) if settings.DEBUG else (
                    "Ocurrió un error interno. Por favor intenta de nuevo "
                    "o contacta al administrador."
                ),
            },
        },
    )


@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(
    request: Request,
    exc: ResponseValidationError,
) -> JSONResponse:
    """
    Maneja errores de validación de respuesta sin forzar str(exc),
    evitando cascadas por __repr__ de objetos ORM expirados.
    """
    logger.exception(
        "Error de validación de respuesta en %s %s",
        request.method,
        request.url,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "RESPONSE_VALIDATION_ERROR",
                "message": "Error interno serializando la respuesta.",
            },
        },
    )


# ── Routers ───────────────────────────────────────────────────────────
# Se registran sprint a sprint conforme se desarrollan.
# Sprint 1:
from app.routers.auth import router as auth_router
from app.routers.hse import router as hse_router
from app.routers.herramientas import router as herramientas_router
from app.routers.ws import router as ws_router

app.include_router(auth_router,          prefix="/api/v1")
app.include_router(hse_router,           prefix="/api/v1")
app.include_router(herramientas_router)  # prefix ya definido en el router
app.include_router(ws_router)            # Sin prefijo: ws://host/ws/{sede_id}
#
# Sprint 2:
# from app.routers import personas, accesos
# app.include_router(personas.router, prefix="/api/v1", tags=["👤 Personas"])
# app.include_router(accesos.router,  prefix="/api/v1", tags=["🚶 Accesos"])
#
# Sprint 3-4:
# from app.routers import parking
# app.include_router(parking.router, prefix="/api/v1", tags=["🚗 Parking"])
#
# Sprint 5-6:
# from app.routers import hse
# app.include_router(hse.router, prefix="/api/v1", tags=["🦺 HSE"])
#
# Sprint 7:
# from app.routers import activos
# app.include_router(activos.router, prefix="/api/v1", tags=["📡 Activos NFC"])
#
# Sprint 8:
# from app.routers import gh
# app.include_router(gh.router, prefix="/api/v1", tags=["👔 Gestión Humana"])
#
# Sprint 9:
# from app.routers import reportes, config
# app.include_router(reportes.router, prefix="/api/v1", tags=["📊 Reportes"])
# app.include_router(config.router,   prefix="/api/v1", tags=["⚙️ Configuración"])
#


# ── Endpoints del sistema ─────────────────────────────────────────────
@app.get("/", tags=["Sistema"], summary="Información de la API")
async def root():
    """Retorna información básica de la API."""
    return ok({
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.DEBUG else "Deshabilitado en producción",
        "health": "/health",
    })


@app.get("/health", tags=["Sistema"], summary="Health check del sistema")
async def health_check():
    db_ok = await check_db_connection()
    return ok(
        data={
            "status":      "ok" if db_ok else "degraded",
            "app":         settings.APP_NAME,
            "version":     settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "services": {
                "database": "ok" if db_ok else "error",
                "api":      "ok",
            },
        }
    )